---
title: Cloudinary Image Hosting Guide
---

# Hosting Images on Cloudinary

:::caution Preview
This App Registry documentation is in preview and is not production-ready.
:::

Use [Cloudinary](https://cloudinary.com/) to host your app icons, descriptions, and screenshots.

We have had success with Cloudinary although the setup isn't straightforward:
- Free tier with generous limits
- Image optimization and transformation
- Global CDN for fast loading
- Reliability and uptime

---

## 🔐 1. Create a Cloudinary Account

1. Go to [cloudinary.com](https://cloudinary.com/)
2. Click **Sign Up**
3. Choose the **Individual** account type (sufficient for developer/testnet use; upgrade later if needed)
4. Use **"Programmable Media"** — *not* the "MediaFlows" or "DAM" options
5. After signup, you'll land in the **Media Library dashboard**

---

## 📁 2. Organize Your Assets

By default, Cloudinary generates a random `public_id` (e.g. `v16839038/k3jhsdf8321`), but you can override this to make URLs easier to reference in metadata.

### Recommended Structure

Use a format like:

`apps/your-app-slug/filename`

**Examples:**
- `apps/mycoolapp/icon`
- `apps/mycoolapp/screenshot-1`
- `apps/mycoolapp/screenshot-2`

This creates clean image URLs like:

```
https://res.cloudinary.com/your-cloud-name/image/upload/apps/mycoolapp/icon.png
```

---

## 🖼️ 3. Upload an Asset

1. Go to [Cloudinary Media Library](https://console.cloudinary.com/)
2. Click **Upload** button (top right)
3. Choose your image file
4. **Important:** Under **Public ID**, enter your custom path: `apps/mycoolapp/icon`
5. Click **Advanced** if needed to disable automatic unique suffixes
6. Complete the upload

Once uploaded, your image will be available at:

```
https://res.cloudinary.com/your-cloud-name/image/upload/apps/mycoolapp/icon.png
```

**Replace** `your-cloud-name` with your actual Cloudinary account name (found in your dashboard).

---

## 🧪 4. Get Your Public URL

After upload:

1. Click on your uploaded image in the Media Library
2. Click the **"Share"** button
3. Copy the public URL

Or construct it manually:
```
https://res.cloudinary.com/[your-cloud-name]/image/upload/[your-public-id].[extension]
```

---

## ✅ 5. Test the URL

Open the generated URL in your browser to verify:
- Image loads correctly
- URL is publicly accessible (no authentication required)
- Image displays at expected quality

You can now use this URL in your app metadata!
