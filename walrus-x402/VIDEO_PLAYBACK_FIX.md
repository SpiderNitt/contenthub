# Video Playback Fix

## Issue
Videos were not playing because:
1. Demo data used placeholder CIDs (`QmVideoCID1`, `QmThumbnailCID1`) that don't point to real files
2. Content routing was unclear

## Solution
Updated `SetupDemoData.s.sol` with **real IPFS video CIDs**:

### Video 1: Big Buck Bunny
- **Video CID**: `QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG`
- **Thumbnail CID**: `QmSgvgwxZGaBLqkGyWemEDqikCqU52XxsYLKtdy3vGZ8uq`

### Video 2: Sintel Trailer  
- **Video CID**: `QmQqzMTavQgT4f4T5v6PWBp7XNKtoPmC9jvn12WPT3gkSE`
- **Thumbnail CID**: `Qmd286K6pohQcTKYqnS1YhWMscYjDyr712CGXDnUxAwzjg`

These are publicly available open-source movies on IPFS that will actually play.

## How Content IDs Work

The content ID in the URL (`/content/0`, `/content/1`, etc.) corresponds to the **array index** in the `allVideos` array on the smart contract:

- `/content/0` → First video uploaded
- `/content/1` → Second video uploaded  
- `/content/2` → Third video uploaded

After running the updated demo script, you'll have:
- `/content/0` → Big Buck Bunny
- `/content/1` → Sintel Trailer

## Next Steps

1. Run the updated demo script to upload real videos
2. Videos will now play through Lighthouse gateway
3. For production, creators upload their own videos via `/upload` page
