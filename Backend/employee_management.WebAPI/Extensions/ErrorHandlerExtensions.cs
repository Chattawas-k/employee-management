using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using employee_management.Application.Common.Exceptions;
using System.Net;
using System.Text.Json;

namespace employee_management.WebAPI.Extensions
{
    public static class ErrorHandlerExtensions
    {
        public static void UseErrorHandler(this IApplicationBuilder app)
        {
            app.UseExceptionHandler(appError =>
            {
                appError.Run(async context =>
                {
                    var contextFeature = context.Features.Get<IExceptionHandlerFeature>();
                    if (contextFeature == null) return;

                    var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
                    var exception = contextFeature.Error;

                    // Log the exception
                    logger.LogError(exception, "An unhandled exception occurred. {ExceptionType}: {Message}", 
                        exception.GetType().Name, exception.Message);

                    context.Response.ContentType = "application/json";

                    // Determine status code based on exception type
                    context.Response.StatusCode = exception switch
                    {
                        BadRequestException => (int)HttpStatusCode.BadRequest,
                        NoDataFoundException => (int)HttpStatusCode.NotFound,
                        UserAlreadyExistsException => (int)HttpStatusCode.Conflict,
                        SocketException => (int)HttpStatusCode.ServiceUnavailable,
                        OperationCanceledException => (int)HttpStatusCode.ServiceUnavailable,
                        DbUpdateException => (int)HttpStatusCode.BadRequest,
                        _ => (int)HttpStatusCode.InternalServerError
                    };

                    var badRequestErrors = (exception as BadRequestException)?.Errors;

                    object errorResponse;

                    if (badRequestErrors != null && badRequestErrors.Length > 0)
                    {
                        errorResponse = new
                        {
                            statusCode = context.Response.StatusCode,
                            message = exception.GetBaseException().Message,
                            errors = badRequestErrors
                        };
                    }
                    else
                    {
                        // For internal server errors, don't expose exception details in production
                        var message = context.Response.StatusCode == (int)HttpStatusCode.InternalServerError
                            ? "An internal server error occurred."
                            : exception.GetBaseException().Message;

                        errorResponse = new
                        {
                            statusCode = context.Response.StatusCode,
                            message = message
                        };
                    }

                    await context.Response.WriteAsync(JsonSerializer.Serialize(errorResponse));
                });
            });
        }
    }
}
