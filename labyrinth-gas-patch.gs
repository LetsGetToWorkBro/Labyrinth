/**
 * LABYRINTH BJJ — GAS PATCH MODULE
 * ──────────────────────────────────────────────────────────────────────────────
 * PURPOSE: This file contains the REPLACEMENT functions for the existing GAS
 * backend. Copy-paste each section into your Google Apps Script editor to fix:
 *
 *   1. recordCheckIn   — now writes TotalPoints + CurrentStreak + MaxStreak
 *                        back to the Members sheet row after every check-in,
 *                        and logs each event to PointsLog.
 *
 *   2. getLeaderboard  — no longer uses CacheService; always reads live data
 *                        from the Bookings sheet, joined to Members for belt/role.
 *                        Supports an optional `forceRefresh` flag from the client.
 *
 *   3. syncAchievements — new handler (was returning "Booking confirmed!" because
 *                         no case existed). Reads badge keys from the client payload
 *                         and upserts them into the MemberBadges sheet.
 *
 *   4. saveMemberStats  — new action. Accepts { xp, streak, maxStreak } from the
 *                         client and writes them directly to the Members row.
 *                         Called after every check-in so localStorage XP stays
 *                         in sync with the sheet.
 *
 * HOW TO APPLY:
 *   a. Open script.google.com → your Labyrinth project
 *   b. Find the existing doGet / doPost and the handler functions below
 *   c. Replace each function with the patched version below
 *   d. Save → Deploy → New deployment (or "Manage deployments → edit")
 *   e. Copy the new web app URL back into client/src/lib/locations.ts gasUrl
 *
 * NOTE: Column indices below are 1-based (Sheets API convention).
 * Members sheet columns:
 *   A(1)=ID  B(2)=Name  C(3)=Phone  D(4)=Email  E(5)=Membership
 *   F(6)=Belt  G(7)=Type  H(8)=StripeCustomerID  I(9)=StripeSubscriptionID
 *   J(10)=AccountSetupToken  K(11)=PasswordHash  L(12)=PrimaryHolder
 *   M(13)=Role  N(14)=StartDate  O(15)=Status  P(16)=Notes
 *   Q(17)=BillingDate  R(18)=Plan  S(19)=CurrentStreak  T(20)=MaxStreak
 *   U(21)=TotalPoints  V(22)=LeaderboardOptIn  W(23)=JoinDate
 */

// ─── COLUMN CONSTANTS ─────────────────────────────────────────────────────────
var COL_MEMBER_EMAIL         = 4;   // D
var COL_MEMBER_BELT          = 6;   // F
var COL_MEMBER_ROLE          = 13;  // M
var COL_MEMBER_STATUS        = 15;  // O
var COL_MEMBER_CURRENT_STREAK = 19; // S
var COL_MEMBER_MAX_STREAK    = 20;  // T
var COL_MEMBER_TOTAL_POINTS  = 21;  // U
var COL_MEMBER_LB_OPT_IN     = 22;  // V
var COL_MEMBER_NAME          = 2;   // B

// ─── HELPER: find a member row by email ──────────────────────────────────────
function findMemberRowByEmail_(ss, email) {
  var sheet = ss.getSheetByName('Members');
  if (!sheet) return null;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if ((data[i][COL_MEMBER_EMAIL - 1] || '').toString().toLowerCase().trim() ===
        email.toLowerCase().trim()) {
      return { row: i + 1, data: data[i], sheet: sheet };
    }
  }
  return null;
}

// ─── HELPER: get Monday of the week for a date ──────────────────────────────
function getWeekStart_(date) {
  var d = new Date(date);
  var day = d.getDay(); // 0=Sun
  var diff = (day === 0) ? -6 : (1 - day); // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─── HELPER: count checkins this week for an email ──────────────────────────
function countWeeklyCheckins_(ss, email) {
  var bookings = ss.getSheetByName('Bookings');
  if (!bookings) return 0;
  var data = bookings.getDataRange().getValues();
  var now = new Date();
  var weekStart = getWeekStart_(now);
  var count = 0;
  for (var i = 1; i < data.length; i++) {
    var rowEmail = (data[i][2] || '').toString().toLowerCase().trim(); // col C = Email
    if (rowEmail !== email.toLowerCase().trim()) continue;
    var ts = new Date(data[i][0]); // col A = Timestamp
    if (ts >= weekStart) count++;
  }
  return count;
}

// ─── HELPER: count unique weeks trained ─────────────────────────────────────
// Returns number of consecutive weeks (ending this week) where the member
// has ≥1 check-in. Drives the "weekly streak" used by the leaderboard badge.
function computeWeeklyStreak_(ss, email) {
  var bookings = ss.getSheetByName('Bookings');
  if (!bookings) return 0;
  var data = bookings.getDataRange().getValues();
  var emailLower = email.toLowerCase().trim();

  // Collect set of week-start ISO strings where member trained
  var weekSet = {};
  for (var i = 1; i < data.length; i++) {
    var rowEmail = (data[i][2] || '').toString().toLowerCase().trim();
    if (rowEmail !== emailLower) continue;
    var ts = new Date(data[i][0]);
    if (isNaN(ts.getTime())) continue;
    var ws = getWeekStart_(ts).toISOString().split('T')[0];
    weekSet[ws] = true;
  }

  // Walk backwards from current week and count consecutive weeks
  var streak = 0;
  var cursor = getWeekStart_(new Date());
  while (true) {
    var key = cursor.toISOString().split('T')[0];
    if (!weekSet[key]) break;
    streak++;
    cursor.setDate(cursor.getDate() - 7);
  }
  return streak;
}

// ─── PATCHED: recordCheckIn ──────────────────────────────────────────────────
/**
 * Records a class check-in, then:
 *   • Increments TotalPoints in the Members sheet
 *   • Recomputes CurrentStreak (weekly consecutive) and updates Members sheet
 *   • Updates MaxStreak if new streak > current max
 *   • Appends a row to PointsLog for a full audit trail
 *   • Checks for streak milestones (7/14/21/30 days) via Milestones sheet
 *   • Checks for badge unlock thresholds and writes to MemberBadges
 *   • Returns totalPoints, currentStreak, streakMilestone, newBadges
 */
function recordCheckIn(payload, ss) {
  var email    = (payload.email || '').trim();
  var name     = (payload.name  || '').trim();
  var className = (payload.className || '').trim();

  if (!email) {
    return { success: false, error: 'Email required' };
  }

  // ── 1. Write to Bookings sheet ───────────────────────────────────────────
  var bookings = ss.getSheetByName('Bookings');
  if (!bookings) return { success: false, error: 'Bookings sheet missing' };

  var now = new Date();
  var todayStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd');

  // Dedup: check if already checked in today for this class
  var bData = bookings.getDataRange().getValues();
  for (var b = 1; b < bData.length; b++) {
    var bEmail = (bData[b][2] || '').toString().toLowerCase().trim();
    var bClass = (bData[b][4] || '').toString().trim();
    var bDate  = (bData[b][6] || '').toString().trim();
    if (bEmail === email.toLowerCase() &&
        bClass === className &&
        bDate  === todayStr) {
      return { success: true, alreadyCheckedIn: true, pointsAwarded: 0, totalPoints: 0, currentStreak: 0, newBadges: [] };
    }
  }

  // Write booking row: Timestamp, Name, Email, Phone, Class, Day/Time, Date, Status
  bookings.appendRow([now, name, email, '', className, payload.time || '', todayStr, 'checked-in']);

  // ── 2. Find Member row ───────────────────────────────────────────────────
  var memberInfo = findMemberRowByEmail_(ss, email);
  var totalPoints   = 10; // base award
  var currentStreak = 0;
  var maxStreak     = 0;
  var pointsAwarded = 10;

  if (memberInfo) {
    var mRow  = memberInfo.row;
    var mData = memberInfo.data;
    var mSheet = memberInfo.sheet;

    // Read existing values (cols are 0-indexed in array, 1-indexed in sheet)
    var prevTotal   = parseInt(mData[COL_MEMBER_TOTAL_POINTS  - 1] || '0') || 0;
    var prevStreak  = parseInt(mData[COL_MEMBER_CURRENT_STREAK - 1] || '0') || 0;
    var prevMax     = parseInt(mData[COL_MEMBER_MAX_STREAK     - 1] || '0') || 0;

    // Recompute streak from Bookings (live, accurate)
    currentStreak = computeWeeklyStreak_(ss, email);
    maxStreak     = Math.max(prevMax, currentStreak);
    totalPoints   = prevTotal + pointsAwarded;

    // Write back to Members sheet
    mSheet.getRange(mRow, COL_MEMBER_CURRENT_STREAK).setValue(currentStreak);
    mSheet.getRange(mRow, COL_MEMBER_MAX_STREAK    ).setValue(maxStreak);
    mSheet.getRange(mRow, COL_MEMBER_TOTAL_POINTS  ).setValue(totalPoints);
  }

  // ── 3. Write to PointsLog ────────────────────────────────────────────────
  var pointsLog = ss.getSheetByName('PointsLog');
  if (pointsLog) {
    var logId = 'PL_' + now.getTime();
    pointsLog.appendRow([logId, email, name, 'checkin', pointsAwarded, totalPoints, todayStr, className, '']);
  }

  // ── 4. Streak milestones ─────────────────────────────────────────────────
  var streakMilestone = null;
  var STREAK_MILESTONES = [7, 14, 21, 30, 60, 90];
  for (var sm = 0; sm < STREAK_MILESTONES.length; sm++) {
    if (currentStreak === STREAK_MILESTONES[sm]) {
      streakMilestone = currentStreak;
      // Write to Milestones sheet
      var milestones = ss.getSheetByName('Milestones');
      if (milestones) {
        var mlId = 'ML_' + now.getTime();
        milestones.appendRow([
          '', email, name, 'streak', currentStreak, currentStreak + '-week',
          todayStr, false, '', false, mlId
        ]);
      }
      break;
    }
  }

  // ── 5. Badge unlocks ─────────────────────────────────────────────────────
  var newBadges = [];
  var badgesSheet = ss.getSheetByName('MemberBadges');
  var totalCheckIns = bData.length - 1 + 1; // +1 for the row we just wrote

  // Count member's total checkins
  var memberCheckins = 0;
  var allBookings = bookings.getDataRange().getValues();
  var emailLower = email.toLowerCase().trim();
  for (var ab = 1; ab < allBookings.length; ab++) {
    if ((allBookings[ab][2] || '').toString().toLowerCase().trim() === emailLower) memberCheckins++;
  }

  // Badge thresholds: [key, label, icon, threshold (checkin count)]
  var BADGE_THRESHOLDS = [
    ['first_class',  'First Step',     '🥋', 1],
    ['mat_10',       'Mat Regular',    '⚡', 10],
    ['mat_50',       'Mat Warrior',    '🔥', 50],
    ['mat_100',      'Century Club',   '💯', 100],
    ['mat_200',      'Mat Legend',     '🏆', 200],
  ];

  if (badgesSheet) {
    var existingBadges = badgesSheet.getDataRange().getValues();
    var existingKeys = {};
    for (var eb = 1; eb < existingBadges.length; eb++) {
      var bEmail2 = (existingBadges[eb][1] || '').toString().toLowerCase().trim();
      var bKey    = (existingBadges[eb][3] || '').toString().trim();
      if (bEmail2 === emailLower) existingKeys[bKey] = true;
    }

    for (var bt = 0; bt < BADGE_THRESHOLDS.length; bt++) {
      var badgeKey   = BADGE_THRESHOLDS[bt][0];
      var badgeLabel = BADGE_THRESHOLDS[bt][1];
      var badgeIcon  = BADGE_THRESHOLDS[bt][2];
      var threshold  = BADGE_THRESHOLDS[bt][3];

      if (memberCheckins >= threshold && !existingKeys[badgeKey]) {
        var badgeId = 'BG_' + now.getTime() + '_' + bt;
        badgesSheet.appendRow([badgeId, email, name, badgeKey, badgeLabel, badgeIcon, now.toISOString(), false, '', memberCheckins]);
        newBadges.push({ key: badgeKey, label: badgeLabel, icon: badgeIcon });
      }
    }
  }

  // ── 6. Return enriched response ──────────────────────────────────────────
  return {
    success:         true,
    pointsAwarded:   pointsAwarded,
    totalPoints:     totalPoints,
    currentStreak:   currentStreak,
    maxStreak:       maxStreak,
    streakMilestone: streakMilestone,
    newBadges:       newBadges,
    alreadyCheckedIn: false,
  };
}

// ─── PATCHED: getLeaderboard ──────────────────────────────────────────────────
/**
 * Returns the weekly leaderboard without server-side caching.
 * Score = check-ins this week × 10. Joined to Members for belt/role.
 * Only includes members where LeaderboardOptIn is not explicitly "FALSE".
 * Accepts optional { forceRefresh: true } to bypass any residual cache.
 */
function getLeaderboard(payload, ss) {
  var bookings = ss.getSheetByName('Bookings');
  var members  = ss.getSheetByName('Members');
  if (!bookings || !members) {
    return { success: false, error: 'Sheets missing', leaderboard: [] };
  }

  // Week window: Monday 00:00 → Sunday 23:59 (current week)
  var now = new Date();
  var weekStart = getWeekStart_(now);
  var weekEnd   = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  // Build map: email → checkin count this week
  var bData  = bookings.getDataRange().getValues();
  var counts = {}; // email → { count, name }
  for (var b = 1; b < bData.length; b++) {
    var ts       = new Date(bData[b][0]);
    var bEmail   = (bData[b][2] || '').toString().toLowerCase().trim();
    var bName    = (bData[b][1] || '').toString().trim();
    if (!bEmail) continue;
    if (ts >= weekStart && ts < weekEnd) {
      if (!counts[bEmail]) counts[bEmail] = { count: 0, name: bName };
      counts[bEmail].count++;
    }
  }

  // Build map: email → { belt, role, optIn } from Members sheet
  var mData    = members.getDataRange().getValues();
  var memberMap = {}; // email → { belt, role, totalPoints, optIn }
  for (var m = 1; m < mData.length; m++) {
    var mEmail  = (mData[m][COL_MEMBER_EMAIL  - 1] || '').toString().toLowerCase().trim();
    var mOptIn  = (mData[m][COL_MEMBER_LB_OPT_IN - 1] || '').toString().toUpperCase();
    var mStatus = (mData[m][COL_MEMBER_STATUS  - 1] || '').toString().toLowerCase();
    if (!mEmail) continue;
    // Skip opted-out members; include all other statuses (active, trial, etc.)
    if (mOptIn === 'FALSE') continue;
    memberMap[mEmail] = {
      name:        (mData[m][COL_MEMBER_NAME - 1] || '').toString().trim(),
      belt:        (mData[m][COL_MEMBER_BELT - 1] || 'white').toString().toLowerCase(),
      role:        (mData[m][COL_MEMBER_ROLE - 1] || '').toString().toLowerCase(),
      totalPoints: parseInt(mData[m][COL_MEMBER_TOTAL_POINTS - 1] || '0') || 0,
      status:      mStatus,
    };
  }

  // Merge: add Members data to counts, and add zero-count active members
  var merged = {}; // email → entry

  // Members who checked in this week
  for (var email in counts) {
    var info = memberMap[email];
    if (!info) continue; // not in members or opted out
    merged[email] = {
      email:      email,
      name:       info.name || counts[email].name,
      belt:       info.belt,
      role:       info.role,
      classCount: counts[email].count,
      score:      counts[email].count * 10,
      totalPoints: info.totalPoints,
    };
  }

  // Sort by score desc, then by name
  var entries = [];
  for (var e in merged) entries.push(merged[e]);
  entries.sort(function(a, b) {
    if (b.score !== a.score) return b.score - a.score;
    return a.name.localeCompare(b.name);
  });

  // Assign ranks
  for (var r = 0; r < entries.length; r++) {
    entries[r].rank = r + 1;
  }

  // Log weekly snapshot to LeaderboardLog
  try {
    var lbLog = ss.getSheetByName('LeaderboardLog');
    if (lbLog && entries.length > 0) {
      var weekOf = Utilities.formatDate(weekStart, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      var genAt  = now.toISOString();
      // Only write if top entry differs from last logged entry (avoid duplicate spam)
      var lastRow = lbLog.getLastRow();
      var writeSnapshot = true;
      if (lastRow > 1) {
        var lastWeekOf = lbLog.getRange(lastRow, 1).getValue();
        if (lastWeekOf.toString() === weekOf) writeSnapshot = false;
      }
      if (writeSnapshot) {
        for (var le = 0; le < Math.min(entries.length, 20); le++) {
          var ent = entries[le];
          lbLog.appendRow([weekOf, ent.rank, ent.email, ent.name, ent.belt, ent.classCount, ent.score, 0, false, genAt]);
        }
      }
    }
  } catch(e2) { /* non-critical */ }

  return {
    success:     true,
    leaderboard: entries,
    weekStart:   weekStart.toISOString(),
    weekEnd:     weekEnd.toISOString(),
    generatedAt: now.toISOString(),
  };
}

// ─── NEW: saveMemberStats ─────────────────────────────────────────────────────
/**
 * Syncs XP + streak from the client directly to the Members sheet.
 * Called after every check-in and on app resume.
 * Payload: { token, xp, streak, maxStreak }
 */
function saveMemberStats(payload, ss) {
  var token     = payload.token || '';
  var xp        = parseInt(payload.xp)        || 0;
  var streak    = parseInt(payload.streak)    || 0;
  var maxStreak = parseInt(payload.maxStreak) || 0;

  // Validate token → get email
  var email = getEmailFromToken_(token, ss);
  if (!email) return { success: false, error: 'Invalid or expired session' };

  var memberInfo = findMemberRowByEmail_(ss, email);
  if (!memberInfo) return { success: false, error: 'Member not found' };

  var mRow   = memberInfo.row;
  var mSheet = memberInfo.sheet;

  // Only overwrite if the incoming value is HIGHER (never regress)
  var prevTotal  = parseInt(memberInfo.data[COL_MEMBER_TOTAL_POINTS   - 1] || '0') || 0;
  var prevStreak = parseInt(memberInfo.data[COL_MEMBER_CURRENT_STREAK - 1] || '0') || 0;
  var prevMax    = parseInt(memberInfo.data[COL_MEMBER_MAX_STREAK      - 1] || '0') || 0;

  var newTotal  = Math.max(prevTotal,  xp);
  var newStreak = streak; // always trust server-recomputed streak from recordCheckIn
  var newMax    = Math.max(prevMax, maxStreak);

  mSheet.getRange(mRow, COL_MEMBER_TOTAL_POINTS  ).setValue(newTotal);
  mSheet.getRange(mRow, COL_MEMBER_CURRENT_STREAK).setValue(newStreak);
  mSheet.getRange(mRow, COL_MEMBER_MAX_STREAK    ).setValue(newMax);

  return { success: true, totalPoints: newTotal, currentStreak: newStreak, maxStreak: newMax };
}

// ─── NEW: syncAchievements ─────────────────────────────────────────────────────
/**
 * Syncs locally-unlocked achievements to the MemberBadges sheet.
 * Payload: { token, achievements: [{ key, label, icon, earnedAt }] }
 * Upserts: skips badges already recorded for this member.
 */
function syncAchievements(payload, ss) {
  var token        = payload.token || '';
  var achievements = payload.achievements || [];

  // Validate token
  var email = getEmailFromToken_(token, ss);
  if (!email) return { success: false, error: 'Invalid or expired session' };

  var memberInfo = findMemberRowByEmail_(ss, email);
  var memberName = memberInfo ? memberInfo.data[COL_MEMBER_NAME - 1] : '';

  var badgesSheet = ss.getSheetByName('MemberBadges');
  if (!badgesSheet) return { success: false, error: 'MemberBadges sheet missing' };

  // Build set of existing badge keys for this member
  var existing = badgesSheet.getDataRange().getValues();
  var existingKeys = {};
  var emailLower = email.toLowerCase().trim();
  for (var i = 1; i < existing.length; i++) {
    var rowEmail = (existing[i][1] || '').toString().toLowerCase().trim();
    var rowKey   = (existing[i][3] || '').toString().trim();
    if (rowEmail === emailLower) existingKeys[rowKey] = true;
  }

  // Upsert new badges
  var written = 0;
  var now = new Date();
  for (var a = 0; a < achievements.length; a++) {
    var ach = achievements[a];
    var key = (ach.key || '').trim();
    if (!key || existingKeys[key]) continue;
    var badgeId  = 'BG_' + now.getTime() + '_' + a;
    var earnedAt = ach.earnedAt ? new Date(ach.earnedAt).toISOString() : now.toISOString();
    badgesSheet.appendRow([
      badgeId, email, memberName, key,
      ach.label || key, ach.icon || '🏅',
      earnedAt, false, '', ach.triggerValue || ''
    ]);
    existingKeys[key] = true;
    written++;
  }

  return { success: true, written: written, total: achievements.length };
}

// ─── HELPER: getEmailFromToken_ ───────────────────────────────────────────────
// You may already have this in your GAS — if so, don't duplicate it.
// This is a reference implementation assuming tokens are stored in a Tokens
// sheet or a Properties store. Adjust to match your existing implementation.
function getEmailFromToken_(token, ss) {
  if (!token) return null;
  // Primary: check PropertiesService (fast, if you store tokens there)
  try {
    var props = PropertiesService.getScriptProperties();
    var stored = props.getProperty('token_' + token);
    if (stored) {
      var parsed = JSON.parse(stored);
      if (parsed && parsed.email && parsed.expires > Date.now()) {
        return parsed.email;
      }
    }
  } catch(e) {}

  // Fallback: scan Members sheet for matching AccountSetupToken
  // (only if you store session tokens there — otherwise remove this block)
  var membersSheet = ss.getSheetByName('Members');
  if (!membersSheet) return null;
  var data = membersSheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if ((data[i][9] || '').toString() === token) { // col J = AccountSetupToken
      return (data[i][COL_MEMBER_EMAIL - 1] || '').toString().trim();
    }
  }
  return null;
}

// ─── ROUTER ADDITIONS ─────────────────────────────────────────────────────────
/**
 * ADD these cases to your existing switch(action) / if(action===) router.
 * Your doGet / doPost should already have the switch block.
 * Just add these cases:
 *
 *   case 'recordCheckIn':   return recordCheckIn(payload, ss);
 *   case 'getLeaderboard':  return getLeaderboard(payload, ss);
 *   case 'syncAchievements':return syncAchievements(payload, ss);
 *   case 'saveMemberStats': return saveMemberStats(payload, ss);
 *
 * IMPORTANT: Make sure the router calls ContentService.createTextOutput(
 *   JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON)
 * and the response has CORS headers if needed (usually handled by GAS auto).
 */
