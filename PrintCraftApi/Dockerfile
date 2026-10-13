FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["PrintCraftApi/PrintCraftApi.csproj", "PrintCraftApi/"]
RUN dotnet restore "PrintCraftApi/PrintCraftApi.csproj"

COPY . .
WORKDIR /src/PrintCraftApi
RUN dotnet publish "PrintCraftApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

RUN apt-get update && \
    (apt-get install -y --no-install-recommends prusa-slicer || true) && \
    apt-get install -y --no-install-recommends python3 python3-pip && \
    pip3 install --break-system-packages torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cpu && \
    pip3 install --break-system-packages autoforge && \
    rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .

EXPOSE 8080
ENTRYPOINT ["dotnet", "PrintCraftApi.dll"]
