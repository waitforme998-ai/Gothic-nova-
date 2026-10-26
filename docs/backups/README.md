# Store Data Backups & Recovery Guide

This directory preserves disaster recovery snapshots of Gothic Nova's catalog and database configurations.

---

## 1. Directory Structure

| File | Size | Description |
| :--- | :---: | :--- |
| `latest_clean_store_backup.json` | ~4.2 MB | **Active Production Snapshot**: Contains all 25 live products (with WebP CDN links), categories metadata, announcements, and customer reviews from active Supabase project `xtphuycoriazzkoalyyh.supabase.co`. |
| `supabase_sync_backup_1791360131299.json` | 20.6 MB | **Historical Legacy Snapshot (Oct 2024)**: Archival baseline backup taken prior to WebP image bucket extraction (contains legacy inline data URLs). |

---

## 2. Taking an Automated Backup Anytime

Run this single command from your project root:
```bash
node scripts/backup-store.js
```
This fetches the latest state of products, categories, reviews, and announcements directly from Supabase and overwrites `latest_clean_store_backup.json` with an updated timestamp.

---

## 3. Disaster Recovery (Restoration)

If database rows in table `gn_orders` are ever accidentally deleted or corrupted:
1. Open [admin.html](file:///c:/Users/tasaw/Desktop/gothic-nova-store/admin.html).
2. Open Developer Tools Console (`F12` $\rightarrow$ Console).
3. Import the backup data via `SupabaseEngine`:
   ```javascript
   const backup = /* paste contents of latest_clean_store_backup.json */;
   await SupabaseEngine.saveProductsBulk(backup.data.products);
   ```
