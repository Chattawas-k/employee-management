using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;
using employee_management.Application;
using employee_management.Persistence;
using employee_management.Persistence.Context;
using employee_management.WebAPI.Extensions;
using System.Text;
using Microsoft.AspNetCore.Identity;
using employee_management.Domain.Entities;
using employee_management.Persistence.Seeds;

var builder = WebApplication.CreateBuilder(args);

var jwtSettings = builder.Configuration.GetSection("Jwt");
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    var jwtSettings = builder.Configuration.GetSection("Jwt");
    var jwtKey = jwtSettings["Key"] ?? throw new InvalidOperationException("JWT Key is not configured.");
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.FromMinutes(5) // Allow 5 minutes clock skew tolerance
    };
    
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            var authHeader = context.Request.Headers["Authorization"].ToString();
            
            if (string.IsNullOrEmpty(authHeader))
            {
                logger.LogWarning($"⚠️ No Authorization header received for {context.Request.Path}");
            }
            else if (!authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                logger.LogWarning($"⚠️ Authorization header doesn't start with 'Bearer ': {authHeader}");
            }
            else
            {
                logger.LogInformation($"📨 Authorization header received for {context.Request.Path}");
            }
            
            return Task.CompletedTask;
        },
        OnAuthenticationFailed = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogError($"🔴 JWT Authentication Failed for {context.Request.Path}: {context.Exception.Message}");
            logger.LogError($"   Exception Type: {context.Exception.GetType().Name}");
            
            if (context.Exception is SecurityTokenExpiredException expiredException)
            {
                logger.LogError($"   Token expired at: {expiredException.Expires}");
                logger.LogError($"   Server time (UTC): {DateTime.UtcNow}");
                logger.LogError($"   Server time (Local): {DateTime.Now}");
            }
            else if (context.Exception is SecurityTokenInvalidSignatureException)
            {
                logger.LogError($"   ❌ Invalid token signature - check JWT Key configuration");
            }
            else if (context.Exception is SecurityTokenInvalidIssuerException)
            {
                logger.LogError($"   ❌ Invalid token issuer");
            }
            else if (context.Exception is SecurityTokenInvalidAudienceException)
            {
                logger.LogError($"   ❌ Invalid token audience");
            }
            
            logger.LogError($"   Stack trace: {context.Exception.StackTrace}");
            return Task.CompletedTask;
        },
        OnTokenValidated = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogInformation($"✅ JWT Token Validated Successfully for {context.Request.Path}");
            
            var expClaim = context.Principal?.FindFirst("exp")?.Value;
            if (expClaim != null && long.TryParse(expClaim, out var exp))
            {
                var expDate = DateTimeOffset.FromUnixTimeSeconds(exp);
                var timeUntilExp = expDate.UtcDateTime - DateTime.UtcNow;
                logger.LogInformation($"   Token expires at: {expDate.UtcDateTime} UTC");
                logger.LogInformation($"   Server time (UTC): {DateTime.UtcNow}");
                logger.LogInformation($"   Time until expiration: {timeUntilExp.TotalMinutes:F1} minutes");
            }
            
            return Task.CompletedTask;
        },
        OnChallenge = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogWarning($"⚠️ JWT Challenge issued for {context.Request.Path}");
            logger.LogWarning($"   Error: {context.Error}");
            logger.LogWarning($"   Error Description: {context.ErrorDescription}");
            
            return Task.CompletedTask;
        }
    };
})
.AddJwtBearer("AzureAd", options =>
{
    options.Authority = $"https://login.microsoftonline.com/{builder.Configuration["AzureAd:TenantId"]}/v2.0";
    options.Audience = builder.Configuration["AzureAd:ClientId"];
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true
    };
});
builder.Services.AddHttpContextAccessor();
builder.Services.AddMemoryCache();

// Add Response Compression
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<Microsoft.AspNetCore.ResponseCompression.BrotliCompressionProvider>();
    options.Providers.Add<Microsoft.AspNetCore.ResponseCompression.GzipCompressionProvider>();
});

builder.Services.Configure<Microsoft.AspNetCore.ResponseCompression.BrotliCompressionProviderOptions>(options =>
{
    options.Level = System.IO.Compression.CompressionLevel.Optimal;
});

builder.Services.Configure<Microsoft.AspNetCore.ResponseCompression.GzipCompressionProviderOptions>(options =>
{
    options.Level = System.IO.Compression.CompressionLevel.Optimal;
});

// Add Health Checks
builder.Services.AddHealthChecks()
    .AddDbContextCheck<employee_management.Persistence.Context.ApplicationDbContext>("database");

builder.Services.ConfigurePersistence(builder.Configuration);
builder.Services.ConfigureApplication();

// Override Identity's default authentication scheme to use JWT Bearer instead of Cookies
builder.Services.Configure<Microsoft.AspNetCore.Authentication.AuthenticationOptions>(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
});

// Configure Authorization
builder.Services.AddAuthorization(options =>
{
    // Add role-based policies
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin", "SuperAdmin"));
    options.AddPolicy("SuperAdminOnly", policy => policy.RequireRole("SuperAdmin"));
});

builder.Services.ConfigureApiBehavior();
builder.Services.ConfigureCorsPolicy(builder.Configuration);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter(System.Text.Json.JsonNamingPolicy.CamelCase));
    });

// Configure API Versioning
builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new Microsoft.AspNetCore.Mvc.ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
    options.ApiVersionReader = Microsoft.AspNetCore.Mvc.Versioning.ApiVersionReader.Combine(
        new Microsoft.AspNetCore.Mvc.Versioning.QueryStringApiVersionReader("version"),
        new Microsoft.AspNetCore.Mvc.Versioning.HeaderApiVersionReader("X-Version"),
        new Microsoft.AspNetCore.Mvc.Versioning.UrlSegmentApiVersionReader()
    );
});

builder.Services.AddVersionedApiExplorer(setup =>
{
    setup.GroupNameFormat = "'v'VVV";
    setup.SubstituteApiVersionInUrl = true;
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    var provider = builder.Services.BuildServiceProvider().GetRequiredService<Microsoft.AspNetCore.Mvc.ApiExplorer.IApiVersionDescriptionProvider>();
    
    foreach (var description in provider.ApiVersionDescriptions)
    {
        c.SwaggerDoc(description.GroupName, new Microsoft.OpenApi.Models.OpenApiInfo
        {
            Title = "Employee Management API",
            Version = description.ApiVersion.ToString(),
            Description = "Employee Management System API",
            Contact = new Microsoft.OpenApi.Models.OpenApiContact
            {
                Name = "Employee Management Team"
            }
        });
    }
    
    // Add JWT Authentication
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token in the text input below.",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
    
    // Handle enum types as strings
    c.UseInlineDefinitionsForEnums();
    
    // Include XML comments if available
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }
});

var app = builder.Build();

// Migrate database and seed data
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var loggerFactory = services.GetRequiredService<ILoggerFactory>();
    var logger = loggerFactory.CreateLogger<Program>();
    
    try
    {
        // Migrate database first
        var dbContext = services.GetRequiredService<ApplicationDbContext>();
        
        // Check if database can be connected
        if (await dbContext.Database.CanConnectAsync())
        {
            var pendingMigrations = await dbContext.Database.GetPendingMigrationsAsync();
            if (pendingMigrations.Any())
            {
                logger.LogInformation("Applying {Count} pending migrations...", pendingMigrations.Count());
                await dbContext.Database.MigrateAsync();
                logger.LogInformation("Database migration completed successfully.");
            }
            else
            {
                logger.LogInformation("Database is up to date. No migrations to apply.");
            }
        }
        else
        {
            logger.LogWarning("Cannot connect to database. Skipping migration.");
        }

        // Seed data
        var userManager = services.GetRequiredService<UserManager<User>>();
        var roleManager = services.GetRequiredService<RoleManager<Role>>();

        // Seed in correct order: Departments → Positions → Employees → Roles → Users
        await DefaultDepartments.SeedAsync(dbContext);
        await DefaultPositions.SeedAsync(dbContext);
        await DefaultEmployees.SeedAsync(dbContext);
        
        await DefaultRoles.SeedAsync(userManager, roleManager);
        await DefaultSuperAdmin.SeedAsync(userManager, roleManager);
        await DefaultAdmin.SeedAsync(userManager, roleManager);
        await DefaultBasicUser.SeedAsync(userManager, roleManager);
        
        logger.LogInformation("Database seeding completed successfully.");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred during database migration or seeding. Error: {Message}", ex.Message);
        logger.LogError(ex, "Stack trace: {StackTrace}", ex.StackTrace);
        // Don't throw - allow app to start even if migration/seeding fails
    }
}

app.UseResponseCompression();
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    var provider = app.Services.GetRequiredService<Microsoft.AspNetCore.Mvc.ApiExplorer.IApiVersionDescriptionProvider>();
    foreach (var description in provider.ApiVersionDescriptions)
    {
        c.SwaggerEndpoint($"/swagger/{description.GroupName}/swagger.json", 
            $"Employee Management API {description.GroupName.ToUpperInvariant()}");
    }
});

// Add request logging middleware
app.Use(async (context, next) =>
{
    var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
    var authHeader = context.Request.Headers["Authorization"].ToString();
    
    logger.LogInformation($"📥 Incoming Request: {context.Request.Method} {context.Request.Path}{context.Request.QueryString}");
    logger.LogInformation($"   Origin: {context.Request.Headers["Origin"]}");
    
    if (!string.IsNullOrEmpty(authHeader))
    {
        logger.LogInformation($"   Authorization: {authHeader.Substring(0, Math.Min(50, authHeader.Length))}...");
    }
    else
    {
        logger.LogWarning($"   ⚠️ No Authorization header present");
    }
    
    await next();
    
    logger.LogInformation($"📤 Response: {context.Response.StatusCode} for {context.Request.Method} {context.Request.Path}");
});

app.UseErrorHandler();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

// Map Health Check endpoints
app.MapHealthChecks("/health");
app.MapHealthChecks("/health/ready", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready")
});

app.MapControllers();
app.Run();