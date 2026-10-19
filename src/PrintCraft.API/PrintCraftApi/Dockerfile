FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["3d-shop.sln", "./"]
COPY ["PrintCraft.Shared/PrintCraft.Shared.csproj", "PrintCraft.Shared/"]
COPY ["PrintCraft.Features.Users/PrintCraft.Features.Users.csproj", "PrintCraft.Features.Users/"]
COPY ["PrintCraft.Features.Orders/PrintCraft.Features.Orders.csproj", "PrintCraft.Features.Orders/"]
COPY ["PrintCraft.Features.Filaments/PrintCraft.Features.Filaments.csproj", "PrintCraft.Features.Filaments/"]
COPY ["PrintCraft.Features.Payments/PrintCraft.Features.Payments.csproj", "PrintCraft.Features.Payments/"]
COPY ["PrintCraft.Features.Uploads/PrintCraft.Features.Uploads.csproj", "PrintCraft.Features.Uploads/"]
COPY ["PrintCraft.Features.Content/PrintCraft.Features.Content.csproj", "PrintCraft.Features.Content/"]
COPY ["PrintCraft.Features.Notifications/PrintCraft.Features.Notifications.csproj", "PrintCraft.Features.Notifications/"]
COPY ["PrintCraft.Features.Admin/PrintCraft.Features.Admin.csproj", "PrintCraft.Features.Admin/"]
COPY ["PrintCraftApi/PrintCraftApi.csproj", "PrintCraftApi/"]
COPY ["PrintCraftApi.Tests/PrintCraftApi.Tests.csproj", "PrintCraftApi.Tests/"]
RUN dotnet restore "PrintCraftApi/PrintCraftApi.csproj"

COPY . .
WORKDIR /src/PrintCraftApi
RUN dotnet publish "PrintCraftApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

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
