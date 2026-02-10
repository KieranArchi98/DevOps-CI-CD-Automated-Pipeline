# GitHub Container Registry (GHCR) Authentication Setup Guide

## Current Status

✅ **FIXED**: The workflow has been updated to properly authenticate with GHCR using either a Personal Access Token (PAT) or the default `GITHUB_TOKEN`.

## How GHCR Authentication Works in the Pipeline

The workflow now uses this authentication logic (line 215):

```yaml
password: ${{ secrets.GHCR_PAT != '' && secrets.GHCR_PAT || secrets.GITHUB_TOKEN }}
```

This means:
- **If `GHCR_PAT` secret exists and is not empty**: Use it (recommended for better permissions)
- **Otherwise**: Fall back to the automatic `GITHUB_TOKEN` (limited permissions)

## Option 1: Use Default GITHUB_TOKEN (Easiest - No Setup Required)

### What You Get
- ✅ Automatic authentication (no setup needed)
- ✅ Can push to packages in the same repository
- ⚠️ Limited to the repository where the workflow runs
- ⚠️ Token expires after the workflow completes

### What You Need to Do
**NOTHING!** The `GITHUB_TOKEN` is automatically provided by GitHub Actions.

### Verification
Your images should appear at:
- `https://github.com/KieranArchi98/DevOps-CI-CD-Automated-Pipeline/pkgs/container/devops-ci-cd-automated-pipeline-backend`
- `https://github.com/KieranArchi98/DevOps-CI-CD-Automated-Pipeline/pkgs/container/devops-ci-cd-automated-pipeline-frontend`

### Limitations
- Cannot push to packages in other repositories
- Cannot be used for long-lived access outside GitHub Actions

---

## Option 2: Use Personal Access Token (Recommended for Production)

### Why Use a PAT?
- ✅ More control over permissions
- ✅ Can push to multiple repositories
- ✅ Can be used for manual docker login
- ✅ Better for organization-level packages
- ✅ Longer expiration times

### Step-by-Step Instructions

#### Step 1: Create a Personal Access Token (Classic)

1. **Go to GitHub Settings**:
   - Click your profile picture (top right) → **Settings**
   - Scroll down to **Developer settings** (bottom of left sidebar)
   - Click **Personal access tokens** → **Tokens (classic)**
   - Click **Generate new token** → **Generate new token (classic)**

2. **Configure the Token**:
   - **Note**: `DevOps Pipeline GHCR Access` (or any descriptive name)
   - **Expiration**: Choose based on your needs:
     - `90 days` (recommended for testing)
     - `1 year` (for production)
     - `No expiration` (not recommended, but convenient)
   
3. **Select Scopes** (IMPORTANT - check these boxes):
   ```
   ✅ write:packages    (Upload packages to GitHub Package Registry)
   ✅ read:packages     (Download packages from GitHub Package Registry)
   ✅ delete:packages   (Delete packages from GitHub Package Registry - optional)
   ✅ repo              (Full control of private repositories - if your repo is private)
   ```

4. **Generate and Copy**:
   - Click **Generate token** at the bottom
   - **IMMEDIATELY COPY THE TOKEN** - you won't see it again!
   - It will look like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

#### Step 2: Add Token to GitHub Repository Secrets

1. **Navigate to Repository Settings**:
   - Go to your repository: `https://github.com/KieranArchi98/DevOps-CI-CD-Automated-Pipeline`
   - Click **Settings** tab
   - Click **Secrets and variables** → **Actions** (left sidebar)

2. **Create New Secret**:
   - Click **New repository secret**
   - **Name**: `GHCR_PAT` (MUST be exactly this)
   - **Value**: Paste the token you copied (starts with `ghp_`)
   - Click **Add secret**

#### Step 3: Verify the Setup

After adding the secret, the next pipeline run will automatically use it.

**To test immediately**:

1. Make a small change and push to `main` or `develop`:
   ```bash
   git add .
   git commit -m "test: verify GHCR authentication"
   git push origin main
   ```

2. **Monitor the workflow**:
   - Go to **Actions** tab
   - Click on the running workflow
   - Expand the **build-and-push** job
   - Look for the **Log in to GitHub Container Registry** step
   - You should see: `Login Succeeded`

3. **Check for pushed images**:
   - Go to your repository main page
   - Look for **Packages** on the right sidebar
   - You should see your images listed

---

## Option 3: Use Fine-Grained Personal Access Token (Most Secure)

### Why Use Fine-Grained PAT?
- ✅ More granular permissions
- ✅ Repository-specific access
- ✅ Better security audit trail
- ✅ Recommended by GitHub for new tokens

### Step-by-Step Instructions

#### Step 1: Create Fine-Grained PAT

1. **Go to GitHub Settings**:
   - Click your profile picture → **Settings**
   - **Developer settings** → **Personal access tokens** → **Fine-grained tokens**
   - Click **Generate new token**

2. **Configure Token**:
   - **Token name**: `DevOps Pipeline GHCR Access`
   - **Expiration**: Choose your preference (90 days recommended)
   - **Resource owner**: Select your username or organization
   - **Repository access**: 
     - Select **Only select repositories**
     - Choose: `DevOps-CI-CD-Automated-Pipeline`

3. **Permissions** (expand "Permissions" section):
   
   **Repository permissions**:
   ```
   ✅ Contents: Read and write
   ✅ Metadata: Read-only (automatically selected)
   ```
   
   **Account permissions**:
   ```
   ✅ Packages: Read and write
   ```

4. **Generate and Copy**:
   - Click **Generate token**
   - **COPY THE TOKEN IMMEDIATELY**
   - It will look like: `github_pat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

#### Step 2: Add to Repository Secrets

Same as Option 2, Step 2 above:
- Name: `GHCR_PAT`
- Value: Your fine-grained token

---

## Troubleshooting

### Issue 1: "unauthorized: unauthenticated"

**Symptoms**:
```
Error: buildx failed with: error: failed to solve: failed to push ghcr.io/...: 
unauthorized: unauthenticated: User cannot be authenticated with the token provided.
```

**Solutions**:
1. ✅ Verify the `GHCR_PAT` secret is set correctly in repository settings
2. ✅ Ensure the token has `write:packages` scope
3. ✅ Check that the token hasn't expired
4. ✅ Verify the repository name in the workflow matches your actual repository

### Issue 2: "denied: permission_denied"

**Symptoms**:
```
Error: denied: permission_denied: write_package
```

**Solutions**:
1. ✅ Token needs `write:packages` permission
2. ✅ If repository is private, token needs `repo` scope
3. ✅ Check if organization settings allow package creation

### Issue 3: Package Visibility Issues

**If packages are not visible**:

1. **Make Package Public** (if desired):
   - Go to the package page
   - Click **Package settings**
   - Scroll to **Danger Zone**
   - Click **Change visibility** → **Public**

2. **Link Package to Repository**:
   - On package page, click **Connect repository**
   - Select your repository
   - This makes the package appear in your repo's sidebar

### Issue 4: "Resource not accessible by integration"

**Symptoms**:
```
Error: Resource not accessible by integration
```

**Solution**:
This happens when using `GITHUB_TOKEN` with insufficient permissions.

1. **Option A**: Add a `GHCR_PAT` secret (recommended)
2. **Option B**: Update workflow permissions (already done in your workflow at lines 200-202):
   ```yaml
   permissions:
     contents: read
     packages: write
   ```

---

## Verification Checklist

After setup, verify everything works:

- [ ] Secret `GHCR_PAT` is added to repository (or using default `GITHUB_TOKEN`)
- [ ] Token has correct scopes (`write:packages`, `read:packages`)
- [ ] Workflow runs successfully on push to `main` or `develop`
- [ ] "Log in to GitHub Container Registry" step shows "Login Succeeded"
- [ ] Images appear in repository Packages section
- [ ] Images can be pulled: `docker pull ghcr.io/kieranarchi98/devops-ci-cd-automated-pipeline-backend:latest`

---

## Manual Docker Login (For Local Testing)

If you want to test GHCR authentication locally:

```bash
# Using your PAT
echo "YOUR_GHCR_PAT_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Verify login
docker pull ghcr.io/kieranarchi98/devops-ci-cd-automated-pipeline-backend:latest

# Push manually (if needed)
docker tag genesis-backend:latest ghcr.io/kieranarchi98/devops-ci-cd-automated-pipeline-backend:latest
docker push ghcr.io/kieranarchi98/devops-ci-cd-automated-pipeline-backend:latest
```

---

## What Was Fixed in the Workflow

### Before (Problematic):
```yaml
- name: Set GHCR token
  run: echo "GHCR_TOKEN=${{ secrets.GHCR_PAT != '' && secrets.GHCR_PAT || secrets.GITHUB_TOKEN }}" >> $GITHUB_ENV
- uses: docker/login-action@v3.6.0
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ env.GHCR_TOKEN }}  # ❌ Context access issue
```

**Problem**: Using `env.GHCR_TOKEN` in the `with:` block caused a context access warning because environment variables set in one step aren't always accessible in action inputs.

### After (Fixed):
```yaml
- name: Log in to GitHub Container Registry
  uses: docker/login-action@v3.6.0
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GHCR_PAT != '' && secrets.GHCR_PAT || secrets.GITHUB_TOKEN }}  # ✅ Direct access
```

**Benefits**:
- ✅ No intermediate environment variable needed
- ✅ Direct access to secrets in action input
- ✅ Cleaner and more maintainable
- ✅ Fixes lint warning

---

## Summary: What You Need to Do

### Minimum (Use Default Token):
**NOTHING!** The workflow will use `GITHUB_TOKEN` automatically.

### Recommended (Use PAT for Better Control):
1. Create a Personal Access Token with `write:packages` and `read:packages` scopes
2. Add it as a repository secret named `GHCR_PAT`
3. Push a change to trigger the workflow
4. Verify images appear in your repository's Packages section

### Token Details You Need:
- **Token Name**: Any descriptive name (e.g., "DevOps Pipeline GHCR Access")
- **Scopes Required**: 
  - `write:packages`
  - `read:packages`
  - `repo` (if repository is private)
- **Secret Name in GitHub**: `GHCR_PAT` (exactly this name)

That's it! The workflow is now properly configured to authenticate with GHCR. 🚀
