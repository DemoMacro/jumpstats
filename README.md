# JumpStats

![GitHub](https://img.shields.io/github/license/DemoMacro/JumpStats)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](https://www.contributor-covenant.org/version/2/1/code_of_conduct/)

> Modern URL shortener with powerful analytics - Track clicks, analyze geolocation, monitor devices, and gain insights from your shortened links.

## Features

- 🔗 **Link Shortening** - Transform long URLs into short, memorable links that are easy to share and remember
- 📊 **Detailed Analytics** - Track clicks, countries, devices, browsers, and more with interactive charts
- ⏱️ **Time Series Data** - View your link performance over time with hourly, daily, and weekly aggregations
- 🌍 **Geographic Insights** - See where your clicks are coming from with country and city breakdowns
- 🎯 **UTM Tracking** - Understand your marketing campaigns with source, medium, and term tracking
- 📱 **QR Code Generation** - Generate QR codes for your short links instantly, perfect for print materials and offline marketing

## Endpoints

- `/s/[shortCode]` - Redirects to the original URL while tracking click analytics
- `/qr/[shortCode]` - Returns a QR code image for the shortened link

Complete API documentation is available at **https://js.gs/api/reference**

## Deployment

### Prerequisites

- **Bun** runtime
- **PostgreSQL** 14+ database
- **ClickHouse** server for analytics storage
- **Redis** (optional, for caching)

### Installation

```bash
# Install dependencies
bun install

# Build the application
bun run build
```

### Development

```bash
# Start development server
bun run dev
```

The application will be available at `http://localhost:3000`

### Production Deployment

```bash
# Build the application
bun run build

# Start production server
bun run preview
```

#### Docker Deployment

```bash
# Build Docker image
docker build -t jumpstats .

# Run container
docker run -p 3000:3000 \
  --env-file .env \
  jumpstats
```

## Support & Community

- 📫 [Report Issues](https://github.com/DemoMacro/JumpStats/issues)

## License

MIT License - see the [LICENSE](./LICENSE) file for details.

---

Built with ❤️ by [Demo Macro](https://www.demomacro.com/)
