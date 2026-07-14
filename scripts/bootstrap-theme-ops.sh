#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# bootstrap-theme-ops.sh
# Stand up the full theme CI/CD + content-ops infra on a NEW brand repo that
# already contains the (shared base) theme code and these .github/ + scripts/
# + docs/ files.
#
# It does the theme-specific wiring that files alone can't carry:
#   1. create an unpublished Staging theme (CLI) and resolve its ID
#   2. set the 4 GitHub secrets (token read from env — never hardcoded/logged)
#   3. create the production-approval environment + required reviewer
#   4. create labels (content-promotion / promote / refresh)
#   5. generalise brand-specific bits (seed default, doc store/IDs)
#   6. (optional) trigger the refresh workflow to create the promotion issue
#
# PREREQUISITES (manual, by design):
#   - `gh` authenticated (gh auth status) with admin on the target repo
#   - `shopify` CLI installed
#   - a Shopify Theme Access token exported as SHOPIFY_CLI_THEME_TOKEN
#   - the target repo already pushed with the base theme + these files
#   - you decide which theme is Prod (publish it in the admin) and pass its ID
#
# Usage:
#   export SHOPIFY_CLI_THEME_TOKEN=shptka_xxx
#   scripts/bootstrap-theme-ops.sh \
#     --repo owner/new-brand \
#     --store new-brand.myshopify.com \
#     --prod-theme-id 123456789 \
#     --reviewer github-login \
#     [--staging-name "Brand Staging"] [--dry-run]
# ---------------------------------------------------------------------------
set -euo pipefail

REPO="" STORE="" PROD_ID="" REVIEWER="" STAGING_NAME="Staging" DRY=0
while [ $# -gt 0 ]; do
  case "$1" in
    --repo) REPO="$2"; shift 2 ;;
    --store) STORE="$2"; shift 2 ;;
    --prod-theme-id) PROD_ID="$2"; shift 2 ;;
    --reviewer) REVIEWER="$2"; shift 2 ;;
    --staging-name) STAGING_NAME="$2"; shift 2 ;;
    --dry-run) DRY=1; shift ;;
    -h|--help) grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

die() { echo "✖ $*" >&2; exit 1; }
step() { echo ""; echo "▶ $*"; }
do_run() { echo "  + $*"; [ "$DRY" = 1 ] || "$@"; }

# --- preconditions ---------------------------------------------------------
step "Checking preconditions"
command -v gh >/dev/null || die "gh CLI not found"
command -v shopify >/dev/null || die "shopify CLI not found"
gh auth status >/dev/null 2>&1 || die "gh not authenticated (run: gh auth login)"
[ -n "${SHOPIFY_CLI_THEME_TOKEN:-}" ] || die "export SHOPIFY_CLI_THEME_TOKEN first (Theme Access token)"
[ -n "$STORE" ] || die "--store is required"
[ -n "$PROD_ID" ] || die "--prod-theme-id is required"
[ -n "$REVIEWER" ] || die "--reviewer (a GitHub login) is required for the approval gate"
[ -f .github/workflows/deploy-staging.yml ] || die "run this from the repo root that already has the theme files"
REPO="${REPO:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"
echo "  repo=$REPO store=$STORE prod=$PROD_ID reviewer=$REVIEWER staging-name='$STAGING_NAME' dry-run=$DRY"

# --- 1. create the unpublished Staging theme -------------------------------
step "Creating unpublished Staging theme (pushing base theme code)"
if [ "$DRY" = 1 ]; then
  echo "  + shopify theme push --store=$STORE --unpublished --theme=\"$STAGING_NAME\" --json"
  STAGING_ID="<new-staging-id>"
else
  PUSH_JSON=$(SHOPIFY_FLAG_STORE="$STORE" shopify theme push --unpublished --theme="$STAGING_NAME" --json)
  STAGING_ID=$(printf '%s' "$PUSH_JSON" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).theme.id)}catch{process.exit(3)}})' 2>/dev/null || true)
  [ -n "$STAGING_ID" ] || STAGING_ID=$(SHOPIFY_FLAG_STORE="$STORE" shopify theme list --json | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const t=JSON.parse(s).find(x=>x.name===process.argv[1]);console.log(t?t.id:"")}' "$STAGING_NAME")
  [ -n "$STAGING_ID" ] || die "could not resolve the new Staging theme id — check 'shopify theme list'"
fi
echo "  Staging theme id = $STAGING_ID"

# --- 2. GitHub secrets (token via stdin, never in argv/logs) ---------------
step "Setting GitHub secrets on $REPO"
set_secret() { # $1=name $2=value
  echo "  + gh secret set $1"
  [ "$DRY" = 1 ] || printf '%s' "$2" | gh secret set "$1" --repo "$REPO"
}
set_secret SHOPIFY_STORE "$STORE"
set_secret SHOPIFY_PROD_THEME_ID "$PROD_ID"
set_secret SHOPIFY_STAGING_THEME_ID "$STAGING_ID"
set_secret SHOPIFY_CLI_THEME_TOKEN "$SHOPIFY_CLI_THEME_TOKEN"

# --- 3. production-approval environment + reviewer -------------------------
step "Creating production-approval environment with reviewer $REVIEWER"
if [ "$DRY" = 1 ]; then
  echo "  + gh api PUT repos/$REPO/environments/production-approval (reviewer=$REVIEWER)"
else
  RID=$(gh api "users/$REVIEWER" -q .id)
  gh api --method PUT "repos/$REPO/environments/production-approval" \
    --input - >/dev/null <<JSON
{ "reviewers": [ { "type": "User", "id": $RID } ] }
JSON
fi

# --- 4. labels -------------------------------------------------------------
step "Creating labels"
mklabel() { echo "  + gh label create $1"; [ "$DRY" = 1 ] || gh label create "$1" --repo "$REPO" --color "$2" --description "$3" 2>/dev/null || true; }
mklabel content-promotion 0e8a16 "Auto-maintained content promotion checklist"
mklabel promote           d93f0b "Promote the checked pages to Production"
mklabel refresh           1d76db "Rebuild the content list (auto-removed)"

# --- 5. generalise brand-specific bits -------------------------------------
step "Generalising brand-specific files"
do_run sed -i 's#^\(        default:\).*#\1 ""#' .github/workflows/theme-seed-pages.yml || true
# doc store/theme IDs (mechanical bits only — review the doc for brand copy)
do_run sed -i "s/iyeamb-p0.myshopify.com/$STORE/g; s/154568622272/$STAGING_ID/g; s/154633666752/$PROD_ID/g" docs/THEME_CI_CD.md || true
echo "  NOTE: review docs/THEME_CI_CD.md for remaining brand-specific text."

# --- 6. bootstrap the promotion issue --------------------------------------
step "Bootstrapping the Content promotion issue"
echo "  (requires the workflows to already be on the repo's default branch)"
if [ "$DRY" = 1 ]; then
  echo "  + gh workflow run content-issue-refresh.yml --repo $REPO"
else
  gh workflow run content-issue-refresh.yml --repo "$REPO" 2>/dev/null \
    && echo "  refresh triggered — the issue will appear shortly" \
    || echo "  ⚠ couldn't trigger refresh yet (push the files first, then: gh workflow run content-issue-refresh.yml)"
fi

cat <<DONE

✔ Bootstrap complete for $REPO (Staging theme $STAGING_ID).

Next steps (manual):
  1. Commit & push the generalised file changes (seed default, doc).
  2. Ensure your Prod theme (#$PROD_ID) is the published/live theme.
  3. Merge to main → deploy-staging runs → verify on Staging preview.
  4. Button 1 (Publish Code to Production) to take code live.
  5. Content managers: use the Content promotion issue (tick + 'promote').
DONE
