# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["JobPortalAPI/JobPortalAPI.csproj", "JobPortalAPI/"]
COPY ["JobPortalAPI.Application/JobPortalAPI.Application.csproj", "JobPortalAPI.Application/"]
COPY ["JobPortalAPI.Domain/JobPortalAPI.Domain.csproj", "JobPortalAPI.Domain/"]
COPY ["JobPortalAPI.Infrastructure/JobPortalAPI.Infrastructure.csproj", "JobPortalAPI.Infrastructure/"]

RUN dotnet restore "JobPortalAPI/JobPortalAPI.csproj"

COPY . .
RUN dotnet publish "JobPortalAPI/JobPortalAPI.csproj" -c Release -o /app/publish

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 80
ENTRYPOINT ["dotnet", "JobPortalAPI.dll"]