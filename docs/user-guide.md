# StreamFlow User Guide

This guide covers everything you need to know to use StreamFlow as a music listener. It walks through the app from first login to everyday use, in the order you are likely to encounter each feature.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Your Library](#2-your-library)
3. [Uploading Music](#3-uploading-music)
4. [Playing Music](#4-playing-music)
5. [Shuffle and Repeat](#5-shuffle-and-repeat)
6. [Liking Songs](#6-liking-songs)
7. [Playlists](#7-playlists)
8. [Searching](#8-searching)
9. [Listening History and Statistics](#9-listening-history-and-statistics)
10. [Artist of the Day](#10-artist-of-the-day)
11. [Your Profile](#11-your-profile)
12. [Tips and Shortcuts](#12-tips-and-shortcuts)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Getting Started

### Creating an Account

1. Open StreamFlow in your browser.
2. On the login page, click **Register** (or **Create an account**).
3. Enter your name, email address, and a password.
4. Click **Register** to submit the form.
5. You will be logged in automatically and taken to the main interface.

### Logging In

1. Open StreamFlow in your browser.
2. Enter the email address and password you registered with.
3. Click **Log In**.

If you have forgotten your password, contact the person who manages your StreamFlow instance — there is no self-service password reset in the current version.

### What to Expect After First Login

When you log in for the first time, your library will be empty. The main area will show a message indicating there are no songs yet. This is normal. You will need to upload audio files before you can play anything. See [Uploading Music](#3-uploading-music) below.

The sidebar on the left gives you access to all the main sections: Library, Liked Songs, your playlists, and your Profile.

---

## 2. Your Library

The **Library** section is the central view of all songs that have been uploaded to StreamFlow. To open it, click **Library** in the left sidebar.

### What the Library Shows

The library lists every audio file that has been uploaded, regardless of who uploaded it. Each row shows:

- Song title
- Artist name
- Album name
- Duration
- Genre and year (if available)

### Sorting and Filtering

You can sort the library by clicking on a column header such as **Title**, **Artist**, or **Album**. Clicking the same header again reverses the sort order.

To filter by keyword, use the search bar at the top of the page. As you type, the list narrows to songs that match your search term in the title, artist, or album fields. See [Searching](#8-searching) for more detail.

---

## 3. Uploading Music

You can upload your own audio files directly through the browser.

### Supported File Formats

StreamFlow accepts the following audio formats:

- MP3
- WAV
- FLAC
- M4A

Other formats are not supported and will be rejected during upload.

### File Size Limit

Each file must be **50 MB or smaller**. Files larger than this will be rejected with an error message.

### How to Upload a File

1. Click the **Upload** button. This is typically in the top navigation bar or accessible from the Library view.
2. In the upload panel, click **Choose file** (or drag and drop a file onto the upload area).
3. Select the audio file you want to upload.
4. Click **Upload** to send the file to the server.
5. A progress indicator will appear while the file is uploading. When it finishes, the song will appear in the library.

You can upload one file at a time.

### Automatic Metadata Extraction

When you upload a file, StreamFlow reads the metadata embedded in the file and fills in the song details automatically. The following fields are extracted:

- **Title** — the song name
- **Artist** — the performing artist
- **Album** — the album the song belongs to
- **Duration** — the length of the track
- **Genre** — the music genre
- **Year** — the release year

### If Metadata is Missing

If the file does not contain metadata (or the metadata is incomplete), StreamFlow will use the filename as the title and leave the other fields blank. The song will still be playable. You can identify songs with missing information by looking for blank artist or album fields in the library.

---

## 4. Playing Music

The **player bar** is the strip along the bottom of the screen. It is always visible while you are using the app.

### Starting Playback

To play a song, click on any song in the library, a playlist, or the Liked Songs list. The song will begin playing immediately and its information will appear in the player bar.

### The Player Bar

The player bar contains the following controls:

- **Song info** (left side) — shows the artwork thumbnail, song title, and artist name for the currently playing track.
- **Play / Pause button** (center) — click to toggle playback.
- **Skip Back** — jumps to the previous song in your queue.
- **Skip Forward** — jumps to the next song in your queue.
- **Progress bar** — shows how far through the song you are. Click anywhere on the bar to jump to that position in the song. You can also click and drag the handle to seek.
- **Volume control** (right side) — drag the slider left to lower the volume, right to raise it. Some builds also include a mute button.

### Queue Persistence

The player remembers your current song and your position in the queue if you refresh the page or close and reopen the browser tab. When you return, playback will resume from where you left off (though you will need to press Play again, as audio does not start automatically after a page load).

---

## 5. Shuffle and Repeat

The shuffle and repeat controls are located in the player bar, near the skip buttons.

### Repeat Modes

Click the **Repeat** button to cycle through three modes:

- **No repeat** — the queue plays through once and stops at the end.
- **Repeat all** — when the last song in the queue finishes, playback loops back to the first song.
- **Repeat one** — the current song plays on a continuous loop until you change the mode or skip to another track.

The button icon or color changes to indicate which mode is active.

### Shuffle

Click the **Shuffle** button to randomize the order of songs in your current queue. When shuffle is on, the button is highlighted. Click it again to turn shuffle off and restore the original order.

---

## 6. Liking Songs

You can mark songs as favorites by liking them. Liked songs are saved to a dedicated list so you can find them easily.

### How to Like a Song

- **From the player bar** — while a song is playing, look for the heart icon near the song info. Click it to like the song. Click it again to unlike it.
- **From the library or a playlist** — hover over a song row. A heart icon will appear. Click it to like or unlike the song.

A filled heart means the song is liked. An empty or outlined heart means it is not.

### Finding Your Liked Songs

Click **Liked Songs** in the left sidebar. This page lists every song you have liked, in the order you liked them. You can play songs directly from this list, and you can unlike a song by clicking the heart icon next to it.

---

## 7. Playlists

Playlists let you organize songs into collections. Your playlists appear in the left sidebar.

### Creating a Playlist

1. In the left sidebar, click the **+** button next to "Playlists" (or look for a **New Playlist** button).
2. Enter a name for your playlist.
3. Optionally, add a description.
4. Click **Create** (or **Save**).

The new playlist will appear in your sidebar and open automatically.

### Adding Songs to a Playlist

1. In the library or any song list, right-click on a song (or click the three-dot menu next to it).
2. Select **Add to playlist**.
3. A modal window will open showing your playlists. If you have many playlists, use the search box inside the modal to find the right one by name.
4. Click the playlist you want to add the song to.

The song will be added to the end of that playlist.

### Reordering Songs in a Playlist

Inside a playlist view, you can drag and drop songs to change their order:

1. Hover over the song you want to move — a drag handle (usually represented by six dots or three horizontal lines) will appear on the left side of the row.
2. Click and hold the drag handle.
3. Drag the song up or down to its new position.
4. Release to drop it in place.

The order is saved automatically.

### Setting a Playlist Cover Image

Each playlist can have a custom cover image.

1. Open the playlist.
2. Click on the cover image area (or look for an **Edit** button or pencil icon near the playlist header).
3. In the cover image editor, you have a few options:
   - **Search Unsplash** — type a keyword to find high-quality photos from Unsplash.
   - **Search Flickr** — type a keyword to search Flickr photos.
   - **Stock images** — browse a selection of pre-loaded images if no external API is configured.
4. Click an image to select it as the cover.
5. Save your changes.

Note: Unsplash and Flickr search require the relevant API keys to be configured by your StreamFlow administrator. If they are not set up, only stock images will be available.

### Editing a Playlist Name or Description

1. Open the playlist.
2. Click the playlist name or look for an **Edit** button.
3. Update the name or description.
4. Save the changes.

### Deleting a Playlist

1. Open the playlist, or right-click it in the sidebar.
2. Click **Delete playlist**.
3. Confirm the deletion when prompted.

Deleting a playlist removes the playlist and its song order, but does not delete the audio files themselves. The songs will still be in the library.

---

## 8. Searching

The search bar is at the top of the library view (and may also be accessible globally from the navigation bar, depending on your version).

### How Search Works

Type a word or phrase into the search bar. StreamFlow will search through song titles, artist names, and album names.

Search is **debounced**, which means results do not appear instantly as you type each letter. Instead, the app waits for a brief pause (about half a second) after you stop typing before it runs the search. This is intentional and keeps the interface fast. If results have not appeared yet, wait a moment after finishing your search term.

### Search Tips

- You do not need to type the full word. Typing "beat" will match songs with "Beatles" in the artist field, "Heartbeat" in the title, and so on.
- Search is not case-sensitive.
- If you get no results, check your spelling or try a shorter search term.
- To clear the search and see all songs again, delete the text from the search bar or click the X button inside the field.

---

## 9. Listening History and Statistics

StreamFlow tracks your listening activity automatically whenever you play a song. You do not need to do anything to enable this.

### What is Tracked

- Every song you play is recorded as a listening session.
- Your total listening time is calculated from these sessions.
- The number of times you have played each song (play count) is tracked.

### Viewing Your Stats

Go to your **Profile** page by clicking your name or avatar in the sidebar or navigation bar. The profile page displays:

- Total listening time
- Number of songs played
- Other listening statistics

These stats reflect your personal history and are not shared with other users.

---

## 10. Artist of the Day

The **Artist of the Day** feature shows a featured artist on the home screen or dashboard. It is powered by the Last.fm music database.

When configured, this section displays information about a highlighted artist — typically their name, a brief description, and an image. The featured artist may change daily.

This feature requires a Last.fm API key to be set up by your StreamFlow administrator (`VITE_LASTFM_API_KEY`). If you see a blank or missing Artist of the Day section, it likely means the API key has not been configured on your instance. This does not affect any other functionality in the app.

---

## 11. Your Profile

Your profile page lets you view your listening stats and update your account settings.

### Accessing Your Profile

Click your name, username, or avatar in the left sidebar or navigation bar to open the Profile page.

### Updating Your Profile Picture

1. On the Profile page, click on your current profile picture (or look for an **Edit** or **Upload photo** option).
2. Select an image file from your device.
3. Confirm the upload.

Your new profile picture will appear across the app wherever your avatar is shown.

### Viewing Listening Statistics

The profile page shows a summary of your listening history, including total time listened and songs played. This gives you an overview of your activity on the platform.

---

## 12. Tips and Shortcuts

### Queue Persistence

The player queue and your current position in it are saved automatically. If you refresh the page or navigate away and come back, the player will remember what was playing. You will need to press Play to resume, but you will not lose your place.

### Mobile Usage

StreamFlow works in mobile browsers. On smaller screens, the player bar switches to a compact layout that takes up less space but still provides the essential controls: play/pause, skip, and song info. Some secondary controls (such as the volume slider) may be hidden on mobile to save space.

### Playing from Different Contexts

You can start playback from multiple places in the app. Clicking a song in the library replaces the current queue with the full library starting at that song. Clicking a song inside a playlist loads the playlist as your queue. This lets you move naturally between browsing contexts without having to manually manage a queue.

### Accurate Seek

The progress bar supports seeking — clicking anywhere on it will jump the playback to that position. This works because the audio is delivered in small chunks that support seeking (HTTP range requests). You do not need to wait for the whole file to load before seeking.

---

## 13. Troubleshooting

### I Cannot Log In

- Make sure you are using the correct email address and password.
- Passwords are case-sensitive — check that Caps Lock is not on.
- If you have never registered, you will need to create an account first. Look for a Register or Sign Up link on the login page.
- If you have registered but the login still fails, contact your StreamFlow administrator to check whether your account exists and is active.

### A Song Will Not Play

If a song starts and then stops, or never plays at all:

1. Try refreshing the page.
2. Log out and log back in. Your authentication token may have expired, which can cause playback to fail silently.
3. Try playing a different song. If other songs play fine, there may be a problem with that specific file.
4. If no songs play, check with your administrator that the file storage and backend service are running correctly.

### Upload Fails

If your upload does not complete or returns an error:

- Check that the file format is supported: MP3, WAV, FLAC, or M4A only.
- Check that the file is 50 MB or smaller.
- Make sure you have a stable internet connection. Large files can fail if the connection drops mid-upload.
- Try refreshing the page and uploading again.
- If the problem continues, contact your administrator.

### Playlist Cover Image Not Loading

- If you selected an Unsplash or Flickr image and it is not showing, the API key for that service may not be configured. Try selecting a stock image instead.
- If even a stock image is not loading, try refreshing the page.
- If the cover was loading before and has now disappeared, the image source URL may have changed. Re-select a cover image and save again.

### Changes Do Not Appear Immediately

StreamFlow is a single-page application that updates in real time for most actions. If you notice that a song you just uploaded is not appearing, or a playlist change did not seem to save, try refreshing the page. If the problem persists, contact your administrator.

---

*This guide covers StreamFlow as used through a web browser. If your instance has been customized or extended, some details may differ.*
