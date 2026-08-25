# Ink & Flash

Production-facing front end for Ink & Flash, the event memory brand behind “Sign. Selfie. Send.”


## Brand

**Ink & Flash**  
*Sign. Selfie. Send.*  
See `BRAND.md` for naming, product family, voice and colors.

## Start locally

Double-click `START-HERE.bat`, or run:

```powershell
.\scripts\start-local.ps1
```

Then open `http://localhost:5500`.

The local Python server regenerates all signature QR codes plus the event-wide Share QR so they point to the PC's LAN address for phone testing.

## Core flows

- `index.html` — public marketing site
- `start.html` — event setup / product configuration
- `print-studio.html` — signature cards, sheets, stickers, Share QR signs, collection-box sign
- `guest.html` — signature-slot selfie flow with unlimited retakes and up to 3 saved photos
- `share.html` — event-wide photo uploads using one master QR
- `booth.html` — tablet selfie-station / kiosk mode
- `live-wall.html` — reception TV/projector wall
- `album.html` — event album / publishing preview
- `dashboard.html` — event owner workspace
- `signature-import.html` — capture returned physical signatures
- `review.html` — choose primary selfie, swap pairings, approve before book
- `book.html` — keepsake-book preview

## Physical signature rule

The QR does not replace the original handwriting. Loose signature cards are collected after the guest scans them. Sheets and books remain with the host. After the event, the original signed pieces are scanned into their matching numbered slots.

An optional guest signature photo can be enabled as a backup, but it is not intended to replace the final host scan of the physical signature.

## Backend still needed for production

The local server is intentionally simple. Production needs real authentication, database/object storage, event-specific QR generation, payments/orders, SMS delivery, consent logging, album access control, moderation, print fulfillment and durable edit tokens.

A starter Supabase schema remains under `supabase/schema.sql`.


## Kiosk flow
The kiosk is intentionally fast: one selfie per turn → optional mobile number → save/text → auto-reset for the next guest. There is no retake screen. If someone wants another photo, they take another turn. The event owner selects one kiosk look in event setup; guests never choose filters or modes.

## GitHub Pages preview

The public preview is prepared for this repository and URL:

- Repository: `aalbertsberg-dotcom/SelfieSign`
- Pages URL: `https://aalbertsberg-dotcom.github.io/SelfieSign/`

Run `PUBLISH-GITHUB.bat` from the project folder after the empty GitHub repository exists. The publish script regenerates every QR code for the public Pages URL before committing, so local LAN QR codes are not accidentally published.

On the first push only, enable GitHub Pages in the repository: **Settings → Pages → Deploy from a branch → main → /(root)**.

GitHub Pages is the shareable front-end preview. It uses browser-local storage because GitHub Pages cannot run the production API. Real cross-device events, SMS delivery, authentication and durable uploads remain backend work.

## v10 Flash Station behavior

Flash Station is production-facing UI, not a placeholder experience. On localhost or HTTPS it requests the real front-facing camera. No stock fallback image is shown. If permission is blocked, the station displays an explicit camera-permission state. The kiosk flow is one photo per turn, optional phone number, then next guest. SMS delivery remains a backend integration.
