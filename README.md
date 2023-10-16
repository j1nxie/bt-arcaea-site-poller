# bt-arcaea-site-poller

Poll for the latest score from Arcaea Online to import to Bokutachi.

## Features

- [x] Poll for latest recent score
- [ ] (REQUIRES ARCAEA ONLINE SUBSCRIPTION) Import best 30 scores potential-wise.

## Installation
### With a userscript manager

1. Install a userscript manager (e.g. Greasemonkey or Tampermonkey).
2. Click [here](https://github.com/j1nxie/bt-arcaea-site-poller/raw/main/bt-arcaea-site-poller.user.js).

### With a bookmarklet
(view this site from <https://j1nxie.github.io/bt-arcaea-site-poller/>)

1. Bookmark this link by dragging it to the bookmarks bar: [Bokutachi Arcaea Score Poller](javascript:void(function(d){if(d.location.host==='arcaea.lowiro.com')document.body.appendChild(document.createElement('script')).src='https://j1nxie.github.io/bt-arcaea-site-poller/bt-arcaea-site-poller.min.js?t='+Math.floor(Date.now()/60000)})(document);).

## Usage
1. Go to Arcaea Online (https://arcaea.lowiro.com/en/profile/) and log in.
2. Set up your API key following the instructions you see on the page.
3. Click "Start polling" to start polling for your scores.
4. Click "Stop polling" whenever you wish to stop polling for new recent scores. The script will automatically timeout after 15 minutes.