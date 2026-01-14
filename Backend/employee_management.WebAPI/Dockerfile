# syntax=docker/dockerfile:1

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files first for better layer caching
COPY Backend/employee_management.WebAPI/employee_management.WebAPI.csproj Backend/employee_management.WebAPI/
COPY Backend/employee_management.Application/employee_management.Application.csproj Backend/employee_management.Application/
COPY Backend/employee_management.Persistence/employee_management.Persistence.csproj Backend/employee_management.Persistence/
COPY Backend/employee_management.Domain/employee_management.Domain.csproj Backend/employee_management.Domain/
COPY Backend/Core/Core.csproj Backend/Core/

RUN dotnet restore Backend/employee_management.WebAPI/employee_management.WebAPI.csproj

# Copy the rest of the backend source
COPY Backend/ Backend/

WORKDIR /src/Backend/employee_management.WebAPI
RUN dotnet publish -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8080

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet","employee_management.WebAPI.dll"]
