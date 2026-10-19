FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["3d-shop.sln", "./"]
COPY ["src/PrintCraft.API/PrintCraft.Shared/PrintCraft.Shared.csproj", "src/PrintCraft.API/PrintCraft.Shared/"]
COPY ["src/PrintCraft.API/PrintCraft.Features.Users/PrintCraft.Features.Users.csproj", "src/PrintCraft.API/PrintCraft.Features.Users/"]
COPY ["src/PrintCraft.API/PrintCraft.Features.Orders/PrintCraft.Features.Orders.csproj", "src/PrintCraft.API/PrintCraft.Features.Orders/"]
COPY ["src/PrintCraft.API/PrintCraft.Features.Filaments/PrintCraft.Features.Filaments.csproj", "src/PrintCraft.API/PrintCraft.Features.Filaments/"]
COPY ["src/PrintCraft.API/PrintCraft.Features.Payments/PrintCraft.Features.Payments.csproj", "src/PrintCraft.API/PrintCraft.Features.Payments/"]
COPY ["src/PrintCraft.API/PrintCraft.Features.Uploads/PrintCraft.Features.Uploads.csproj", "src/PrintCraft.API/PrintCraft.Features.Uploads/"]
COPY ["src/PrintCraft.API/PrintCraft.Features.Content/PrintCraft.Features.Content.csproj", "src/PrintCraft.API/PrintCraft.Features.Content/"]
COPY ["src/PrintCraft.API/PrintCraft.Features.Notifications/PrintCraft.Features.Notifications.csproj", "src/PrintCraft.API/PrintCraft.Features.Notifications/"]
COPY ["src/PrintCraft.API/PrintCraft.Features.Admin/PrintCraft.Features.Admin.csproj", "src/PrintCraft.API/PrintCraft.Features.Admin/"]
COPY ["src/PrintCraft.API/PrintCraftApi/PrintCraftApi.csproj", "src/PrintCraft.API/PrintCraftApi/"]
COPY ["src/PrintCraft.API/PrintCraftApi.Tests/PrintCraftApi.Tests.csproj", "src/PrintCraft.API/PrintCraftApi.Tests/"]
RUN dotnet restore "src/PrintCraft.API/PrintCraftApi/PrintCraftApi.csproj"

COPY . .
RUN dotnet publish "src/PrintCraft.API/PrintCraftApi/PrintCraftApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:5001
ENV ASPNETCORE_HTTP_PORTS=5001
ENV ASPNETCORE_ENVIRONMENT=Production

RUN apt-get update && \
    (apt-get install -y --no-install-recommends prusa-slicer || true) && \
    rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .

EXPOSE 5001
ENTRYPOINT ["dotnet", "PrintCraftApi.dll"]
