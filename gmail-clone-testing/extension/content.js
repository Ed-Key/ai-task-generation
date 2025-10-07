/**
 * Content Script - Site Detector & Panel Injector
 *
 * PHASE 1: Minimal stub to allow extension loading
 * PHASE 2: Will implement full injection logic
 */

// Detect which Gmail site we're on
const hostname = window.location.hostname;
const isRealGmail = hostname === 'mail.google.com';
const isCloneGmail = hostname === 'gmail.matrices.ai';

if (isRealGmail || isCloneGmail) {
  const site = isRealGmail ? 'Real Gmail' : 'Clone Gmail';
  console.log(`[Gmail QA Tool] Detected: ${site}`);
  console.log('[Gmail QA Tool] Phase 1: OAuth manager only (panel not yet implemented)');
}

// Phase 2 will add:
// - Panel iframe injection
// - postMessage communication with panel
// - sessionId extraction for clone
