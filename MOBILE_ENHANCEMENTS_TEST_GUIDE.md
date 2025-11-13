# Mobile Enhancements Testing Guide

## 🎉 New Features Implemented

### 1. ✨ Haptic Feedback System
- **Status**: ✅ Complete
- **Files Modified**: `/public/index.html`
- **Features**:
  - Light vibration on wall/paddle collisions
  - Medium vibration on brick destruction
  - Heavy vibration on level complete
  - Strong vibration pattern on life lost
  - Game over vibration sequence
  - User-configurable: Off, Minimal, Full

### 2. 🔋 Page Visibility API (Battery Saver)
- **Status**: ✅ Complete
- **Files Modified**: `/public/index.html`
- **Features**:
  - Auto-pauses game when tab is hidden
  - Prevents battery drain from background gameplay
  - User must manually resume (fair play)

### 3. 📱 Progressive Web App (PWA)
- **Status**: ✅ Complete
- **Files Created**:
  - `/public/manifest.json` - App metadata
  - `/public/service-worker.js` - Offline caching
- **Files Modified**: `/public/index.html` - PWA integration
- **Features**:
  - Installable to home screen (iOS/Android/Desktop)
  - Offline gameplay support
  - Fast loading via aggressive caching
  - Network-first strategy for leaderboard API
  - Cache-first strategy for game assets
  - Auto-update mechanism

## 🧪 Testing Checklist

### Test 1: Haptic Feedback (Mobile Only)

**Requirements**: Android phone or iPhone with Chrome/Safari

**Steps**:
1. Open game on mobile device
2. Click ⚙️ Settings button
3. Verify haptic options: Off, Minimal, Full
4. Test each mode:

   **Full Mode** (default):
   - [ ] Wall bounce = light buzz
   - [ ] Paddle hit = light buzz
   - [ ] Brick destroyed = medium buzz
   - [ ] Multi-hit brick destroyed = strong double-buzz
   - [ ] Level complete = strong double-buzz
   - [ ] Lose life = long pattern
   - [ ] Game over = long pattern

   **Minimal Mode**:
   - [ ] NO vibration on walls/paddle
   - [ ] NO vibration on bricks
   - [ ] YES vibration on level complete
   - [ ] YES vibration on lose life

   **Off Mode**:
   - [ ] No vibration at all

5. [ ] Settings persist after page reload

**Expected Results**:
- Haptic feedback should feel responsive and not laggy
- Vibrations should match event intensity
- Settings should save to localStorage

---

### Test 2: Page Visibility API

**Requirements**: Any device with browser tabs

**Steps**:
1. Start a new game
2. Launch the ball and let it bounce
3. Switch to another tab (or minimize browser on mobile)
4. Wait 5 seconds
5. Switch back to game tab

**Expected Results**:
- [ ] Game automatically pauses when tab hidden
- [ ] Pause button shows "Resume" when you return
- [ ] Ball position is frozen (not lost)
- [ ] No life was lost while tab was hidden
- [ ] Console log: "Game auto-paused (tab hidden)"

**Mobile-Specific Test**:
1. Start game on mobile
2. Press home button (minimize browser)
3. Wait 10 seconds
4. Return to browser

**Expected Results**:
- [ ] Game is paused
- [ ] No battery drain from running game loop
- [ ] Score/lives unchanged

---

### Test 3: PWA Installation (Android)

**Requirements**: Android phone with Chrome

**Steps**:
1. Open game in Chrome: `https://your-domain.com`
2. Wait for page to fully load
3. Look for install prompt (or tap menu → "Install app")
4. Tap "Install" or "Add to Home Screen"
5. Check home screen for BB-Bounce icon
6. Launch from home screen icon

**Expected Results**:
- [ ] App installs to home screen
- [ ] Opens in standalone mode (no browser bar)
- [ ] Icon appears (or default icon if not created yet)
- [ ] Console log: "✅ Service Worker registered successfully"
- [ ] Game plays normally

---

### Test 4: PWA Installation (iOS)

**Requirements**: iPhone with Safari

**Steps**:
1. Open game in Safari: `https://your-domain.com`
2. Tap Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Edit name if desired, tap "Add"
5. Check home screen for BB-Bounce icon
6. Launch from home screen icon

**Expected Results**:
- [ ] App adds to home screen
- [ ] Opens in full screen mode (no Safari bars)
- [ ] Splash screen shows (with app color)
- [ ] Game plays normally
- [ ] Haptic feedback works

**Known iOS Limitation**:
- Service Worker support is limited on iOS
- Full offline mode may not work as well as Android

---

### Test 5: PWA Offline Mode

**Requirements**: Any device with DevTools or Airplane Mode

**Method A: Chrome DevTools**:
1. Open game in Chrome desktop
2. Open DevTools (F12)
3. Go to "Network" tab
4. Check "Offline" checkbox
5. Refresh page (Ctrl+R)

**Method B: Mobile Airplane Mode**:
1. Visit game and let it fully load
2. Turn on Airplane Mode
3. Close and reopen browser
4. Navigate to game URL

**Expected Results**:
- [ ] Game loads from cache
- [ ] Can play game offline
- [ ] Leaderboard shows cached scores or "Offline" message
- [ ] Cannot submit new scores (expected)
- [ ] Console log: "Serving from cache"

---

### Test 6: Service Worker Caching

**Requirements**: Chrome DevTools

**Steps**:
1. Open game in Chrome
2. Open DevTools → Application tab
3. Navigate to "Service Workers" section
4. Verify service worker is "activated and running"
5. Navigate to "Cache Storage" section
6. Expand "bb-bounce-v1.2.0" cache
7. Verify cached files:
   - [ ] / (root)
   - [ ] /index.html
   - [ ] /manifest.json

**Expected Results**:
- Service worker status: Green dot, "activated and running"
- Cache contains game files
- Cache size: ~50-100KB (before adding icons)

---

### Test 7: PWA Update Mechanism

**Requirements**: Local development environment

**Steps**:
1. Make a small change to index.html (e.g., add a comment)
2. Update CACHE_NAME in service-worker.js (e.g., 'v1.2.1')
3. Reload page
4. Check console for update message
5. Reload page again

**Expected Results**:
- [ ] Console log: "New service worker installing"
- [ ] After reload: Old cache deleted
- [ ] New cache created with updated version
- [ ] Changes visible after hard refresh

---

### Test 8: Cross-Device Responsive Testing

**Devices to Test**:

| Device | Viewport | Orientation | Expected Layout |
|--------|----------|-------------|----------------|
| iPhone SE | 375x667 | Portrait | Canvas 3:4, hidden controls |
| iPhone 14 Pro | 393x852 | Portrait | Canvas 3:4, hidden controls |
| iPhone (any) | 844x390 | Landscape | Canvas 16:9, side leaderboard |
| Samsung Galaxy S21 | 360x800 | Portrait | Canvas 3:4, stacked layout |
| iPad | 810x1080 | Portrait | Canvas 4:3, side leaderboard |
| Desktop | 1920x1080 | N/A | Canvas 4:3, full UI |

**For Each Device**:
- [ ] Game loads and displays correctly
- [ ] Touch/mouse controls work smoothly
- [ ] Haptic feedback activates (mobile only)
- [ ] Text is readable
- [ ] Buttons are tappable (min 44x44px)
- [ ] No horizontal scrolling

---

### Test 9: In-App Browser Detection

**Requirements**: Instagram or Facebook app

**Steps**:
1. Share game link in Instagram/Facebook DM (to yourself)
2. Tap link to open in in-app browser
3. Observe layout changes

**Expected Results**:
- [ ] Simplified layout (body.inapp-mode class applied)
- [ ] Hidden: Leaderboard, controls, header
- [ ] Visible: Canvas and minimal stats only
- [ ] Console log: "In-app browser detected"
- [ ] Gameplay still works

**Manual Test** (If no social media):
1. Open game with `?inapp=true` parameter
2. Example: `http://localhost:3000?inapp=true`
3. Should trigger in-app mode

---

### Test 10: Performance Testing

**Requirements**: Chrome DevTools Lighthouse

**Steps**:
1. Open game in Chrome
2. Open DevTools (F12)
3. Go to "Lighthouse" tab
4. Select:
   - ✅ Performance
   - ✅ Progressive Web App
   - ✅ Best Practices
   - Device: Mobile
5. Click "Generate report"

**Target Scores**:
- [ ] Performance: >90
- [ ] PWA: >90 (100 with icons)
- [ ] Best Practices: >90
- [ ] Accessibility: >85

**Common Issues**:
- PWA score <100: Missing icons
- Performance <90: Large JavaScript bundle
- Accessibility <85: Missing ARIA labels

---

## 🐛 Known Issues & Limitations

### iOS Safari Limitations
- Service Worker has limited API support
- Background sync not supported
- Push notifications require workarounds
- Haptic feedback may not work on all iOS versions

### Android Chrome Notes
- Full PWA support, all features work
- May need HTTPS for service worker (localhost exempt)

### Desktop Browser Notes
- Haptic feedback not supported (no navigator.vibrate)
- PWA install works on Chrome, Edge, Brave
- Firefox has limited PWA support

---

## 📊 Browser Compatibility Matrix

| Feature | Chrome Android | Safari iOS | Chrome Desktop | Firefox | Edge |
|---------|---------------|------------|----------------|---------|------|
| Haptic Feedback | ✅ | ✅* | ❌ | ❌ | ❌ |
| Page Visibility | ✅ | ✅ | ✅ | ✅ | ✅ |
| Service Worker | ✅ | ⚠️ | ✅ | ⚠️ | ✅ |
| PWA Install | ✅ | ✅ | ✅ | ❌ | ✅ |
| Offline Mode | ✅ | ⚠️ | ✅ | ⚠️ | ✅ |

*May require iOS 13+ or have limited support

---

## 🔧 Troubleshooting

### Service Worker Not Registering
```bash
# Check console for errors
# Common fix: Hard refresh (Ctrl+Shift+R)
# Or: Clear cache in DevTools → Application → Clear storage
```

### Haptic Feedback Not Working
- Ensure device supports vibration API
- Check browser permissions (some block by default)
- Test in HTTPS (required on some browsers)
- Verify not in Silent/Do Not Disturb mode

### PWA Not Installing
- Must be served over HTTPS (or localhost)
- Check manifest.json syntax (use JSONLint)
- Verify icons exist (or remove from manifest temporarily)
- Some browsers require user engagement before showing prompt

### Game Not Loading Offline
- Service worker may not have cached yet
- Visit page while online first
- Check Cache Storage in DevTools
- Verify service-worker.js is served correctly

---

## 🚀 Quick Test Script

Run this in browser console to verify all features:

```javascript
// Test 1: Haptic Support
console.log('Haptic API:', 'vibrate' in navigator ? '✅' : '❌');

// Test 2: Service Worker
console.log('Service Worker:', 'serviceWorker' in navigator ? '✅' : '❌');

// Test 3: Page Visibility
console.log('Page Visibility:', 'hidden' in document ? '✅' : '❌');

// Test 4: PWA Install
console.log('Install Prompt:', 'BeforeInstallPromptEvent' in window ? '✅' : '❌');

// Test 5: LocalStorage (settings)
console.log('Haptic Setting:', localStorage.getItem('bbBounceHaptics') || 'default');
console.log('Speed Setting:', localStorage.getItem('bbBounceSpeedMultiplier') || 'default');

// Test 6: Service Worker Status
navigator.serviceWorker.ready.then(reg => {
  console.log('SW Scope:', reg.scope);
  console.log('SW Active:', reg.active ? '✅' : '❌');
});
```

---

## 📈 Success Metrics

After testing, you should achieve:

✅ **User Experience**:
- Satisfying haptic feedback on mobile
- No battery drain from hidden tabs
- Fast loading (<2s on 3G)

✅ **Technical**:
- Service worker registered and active
- Lighthouse PWA score >90
- Works offline after first visit

✅ **Compatibility**:
- Works on iOS Safari and Chrome Android
- Graceful degradation on unsupported browsers
- No console errors

---

## 🎯 Next Steps

After completing all tests:

1. **Create Icons**: Follow PWA_ICONS_README.md
2. **Deploy**: Push to production with HTTPS
3. **Monitor**: Check service worker analytics
4. **Iterate**: Gather user feedback on haptics intensity
5. **Enhance**: Consider Wake Lock API, Share API, etc.

---

Need help? Check these resources:
- PWA Documentation: https://web.dev/progressive-web-apps/
- Vibration API: https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API
- Service Workers: https://developers.google.com/web/fundamentals/primers/service-workers
