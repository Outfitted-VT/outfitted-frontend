import { followUser, getProfile, unfollowUser } from "../fits.js";
import { escapeHtml } from "../format.js";
import { avatar, displayName } from "./components.js";
import { openSheet } from "./sheet.js";

function bodyHtml(profile) {
  const stat = (value, label) => `<div class="of-stat"><span class="of-stat-num">${value}</span><span class="of-stat-label">${label}</span></div>`;
  return `<div class="of-person-card">
      ${avatar(profile, { size: 64 })}
      <span class="of-person-text"><b>${escapeHtml(displayName(profile))}</b><small>@${escapeHtml(profile.username)}${profile.current_streak ? ` · ${profile.current_streak}-day streak` : ""}</small></span>
    </div>
    ${profile.bio ? `<p class="of-muted">${escapeHtml(profile.bio)}</p>` : ""}
    <div class="of-stats">${stat(profile.fit_count, "FITS")}${stat(profile.follower_count, "FOLLOWERS")}${stat(profile.following_count, "FOLLOWING")}</div>
    <div class="of-sheet-actions">
      <button type="button" class="of-btn ${profile.is_following ? "of-btn-soft" : "of-btn-ink"}" data-person-follow>${profile.is_following ? "Following" : "Follow"}</button>
      <button type="button" class="of-btn of-btn-soft" data-person-message>Message</button>
    </div>`;
}

export async function openPersonSheet(username, { toast, onMessage }) {
  const { root, close } = openSheet({ title: "Profile", body: `<div class="of-sheet-body" data-person><p class="of-muted">Loading…</p></div>` });
  const body = root.querySelector("[data-person]");
  let profile;
  try {
    profile = await getProfile(username);
  } catch {
    body.innerHTML = `<p class="of-muted">Couldn't load this profile.</p>`;
    return;
  }
  const paint = () => (body.innerHTML = bodyHtml(profile));
  paint();
  body.addEventListener("click", async (event) => {
    if (event.target.closest("[data-person-message]")) {
      close();
      return onMessage(profile.id);
    }
    const follow = event.target.closest("[data-person-follow]");
    if (!follow) return;
    follow.disabled = true;
    const on = !profile.is_following;
    try {
      await (on ? followUser : unfollowUser)(profile.username);
      profile = { ...profile, is_following: on, follower_count: profile.follower_count + (on ? 1 : -1) };
      paint();
    } catch (err) {
      follow.disabled = false;
      toast(err.message || "Couldn't update. Try again.");
    }
  });
}
