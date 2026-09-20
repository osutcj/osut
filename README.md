# OSUT - Official Website

The official portal for **OSUT (Organizația Studenților din Universitatea Tehnică din Cluj-Napoca)**. This project is a modern, high-performance web application designed to keep students informed, represent their interests, and showcase the organization's initiatives.

## 🚀 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) & Vanilla CSS
- **Data Store**: [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) (JSON-based serverless storage)
- **Deployment**: [Vercel](https://vercel.com/)
- **Icons**: [Iconoir](https://iconoir.com/)

## ✨ Key Features

- **Dynamic Blog system**: "OSUT te informează" - fully manageable news feed.
- **Admin Dashboard**: Secure panel at `/admin` to Create, Edit, and Delete posts.
- **Optimized Performance**: 100% `next/image` usage with proper sizing and LCP strategies.
- **Full SEO**: Dynamic `sitemap.xml`, `robots.txt`, and metadata optimized for `osut.org`.
- **Sustainability Hub**: Dedicated section for green initiatives and activity reports.
- **Responsive Design**: Mobile-first approach with premium animations and gradients.

## 🛠️ Getting Started

### Prerequisites

- Node.js 20+
- A Vercel account (for Blob storage)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/osutcj/osut.git
   cd osut
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env.local` file in the root directory:
   ```env
   # Secure password for the /admin dashboard
   ADMIN_PASSWORD=your_secure_password

   # Required for production storage (Get from Vercel Dashboard)
   BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to see the result.

## 🚀 Production Deployment (Port 80 & Port 443 SSL via Nginx)

An automated deployment script is provided to host the project on any Linux server (e.g. DigitalOcean droplet at `164.92.128.118`) with **Port 80 (HTTP)** and **Port 443 (HTTPS)** managed by Nginx and proxied to Next.js running under `systemd`:

### Quick Start on the Server:
```bash
git clone https://github.com/osutcj/osut.git
cd osut
sudo ./deploy.sh --domain osut.org --email office@osutcluj.com
```

### Script Features:
- Automatically installs required dependencies (`Node.js 22 LTS`, `npm`, `git`, `nginx`, `certbot`, `python3-certbot-nginx`, build tools).
- Synchronizes server time to prevent clock skew issues.
- Clones/pulls the latest code directly from GitHub into `/var/www/osut`.
- Sets up dedicated system user permissions (`osut`) and data storage directories (`public/assets/data`, `public/assets/uploads`).
- Configures environment variables in `.env.local` and generates a secure admin password if not provided.
- Compiles the Next.js production build (`npm run build`).
- Manages the Next.js process via `systemd` (`osut.service`) bound to internal loopback (`127.0.0.1:3000`).
- Configures **Nginx** on **Port 80** with ACME webroot challenge support.
- Acquires a **Let's Encrypt SSL certificate** via Certbot using the provided email.
- Automatically upgrades Nginx to **Port 443 (HTTPS)** with modern TLS ciphers and HTTP-to-HTTPS 301 redirection.
- Enables Certbot auto-renewal timer for zero-touch SSL certificate renewals.
- Configures firewall rules (`ufw` or `firewalld`) for web ports 80 and 443 while preserving SSH (port 22).
- Performs automated local health checks on port 80/443 to verify immediate response.

### Available Options:
```bash
sudo ./deploy.sh --help
# Options:
#   --domain <domain>         Domain name (default: osut.org)
#   --email <email>           Email for Let's Encrypt alerts (default: office@osutcluj.com)
#   --dir <path>              Installation directory (default: /var/www/osut)
#   --user <username>         Service user (default: osut)
#   --branch <branch>         Git branch to deploy (default: main)
#   --admin-password <pass>   Admin dashboard password (auto-generated if omitted)
#   --internal-port <port>    Internal Next.js port (default: 3000)
#   --skip-ssl                Deploy Port 80 HTTP only (skip Certbot)
```



## 📖 Project Structure

- `app/`: Contains all routes and API endpoints.
- `components/`: Modular UI building blocks.
- `lib/`: Shared utility logic, including the `posts.ts` data layer.
- `public/`: Static assets, images, and PDF documents.

## 🔒 Administration

To manage the website content:
1. Navigate to `/admin`.
2. Enter the `ADMIN_PASSWORD` defined in your environment variables.
3. Use the dashboard to publish news. Changes typically propagate within 1-3 seconds due to Vercel Blob's global sync.

## 📄 License

This project is maintained by OSUT Cluj. All rights reserved.
