# Requirements to run this model on your PC

Everything you need to run the Spec → Schematic / PCB-from-spec system on your machine.

---

## 1. Hardware (PC / Mac)

| Requirement | Minimum |
|-------------|---------|
| **OS** | macOS 10.15+, Windows 10+, or Linux (x64/arm64) |
| **RAM** | 8 GB (16 GB recommended if running all 3 AI models at once) |
| **Disk** | 15 GB free (Node + dependencies ~500 MB, Ollama models ~15 GB total) |
| **CPU** | Any modern multi-core; Apple Silicon (M1/M2/M3) or x64 |

---

## 2. Software to install

### Node.js (required)

- **Version:** 18.0 or newer (LTS recommended).
- **Install:**
  - **Mac:** `brew install node` or [nodejs.org](https://nodejs.org) → LTS.
  - **Windows:** [nodejs.org](https://nodejs.org) → LTS installer.
- **Check:** `node -v` (e.g. `v20.x.x`).

### npm (comes with Node)

- **Check:** `npm -v`.

### Ollama (required for AI)

- **What:** Local LLM runtime; runs the 3 AI models.
- **Install:** [ollama.ai](https://ollama.ai) → download for your OS, or:
  - **Mac/Linux:** `curl https://ollama.ai/install.sh | sh`
- **Start:** Open the Ollama app, or run `ollama serve` in a terminal.
- **Check:** `ollama list` (should show installed models or empty list).

### Chrome (optional – only for browser scraping)

- Needed only if you use the multi-site Chromium scraper (Puppeteer).
- The project can use a bundled Chrome in `browsers/`; if missing, run:  
  `npx @puppeteer/browsers install chrome@stable --path ./browsers`  
  from the `ai-easyeda-compiler` folder.

---

## 3. AI models (Ollama)

The system uses **3 models**. Pull them with Ollama (one-time, ~15 GB total):

```bash
ollama pull deepseek-r1:7b
ollama pull llama3.1:8b
ollama pull phi4:14b
```

| Model | Used for | Approx. size |
|-------|----------|---------------|
| **deepseek-r1:7b** | Schematic reasoning, spec extraction, product-search Ollama | ~4.5 GB |
| **llama3.1:8b** | Design collaboration, datasheet analysis | ~4.7 GB |
| **phi4:14b** | Calculations, structured output | ~8 GB |

**Check:** `ollama list` should list all three.

---

## 4. Project setup (one-time)

From the `ai-easyeda-compiler` folder:

```bash
cd /path/to/md-to-schematic/ai-easyeda-compiler
npm install
```

This installs: `markdown-it`, `pdf-parse`, `puppeteer`, `uuid`, etc.

---

## 5. Environment / secrets

### Nexar API (for product search)

Create a `.env` file in `ai-easyeda-compiler` with either:

**Option A – Token (simplest)**  
```env
NEXAR_ACCESS_TOKEN=your_jwt_token_here
```

**Option B – Client credentials (token auto-refreshed)**  
```env
NEXAR_CLIENT_ID=your_client_id
NEXAR_CLIENT_SECRET=your_client_secret
```

Copy from `.env.example` if present. Do not commit `.env`.

---

## 6. Data the system needs

### Inputs (you provide)

| Data | Where | Purpose |
|------|--------|--------|
| **Markdown PCB spec** | `inputs/*.md` | Main input: describe the board (components, voltages, interfaces). One `.md` file per design. |
| **Design rules (optional)** | `rules-md/*.md` | Rules for derating, EMI, ESD, etc. |
| **Reference designs (optional)** | `examples-md/*.md` | Example specs for style/reference. |
| **Datasheets (optional)** | `pdf/datasheets-auto/` or `pdf/datasheets-manual/` | PDFs for components; improves BOM/specs. |

**Minimum to run:** At least one markdown file in `inputs/` (e.g. `inputs/my-board.md`) with a short spec (components, voltage, interfaces).

### Outputs (system generates)

| Data | Where | Purpose |
|------|--------|--------|
| **Schematic JSON** | `outputs/schematics/` or `output/` | EasyEDA-importable schematic. |
| **BOM** | From compiler / pipeline | Bill of materials (parts list). |
| **Pin tables** | `outputs/pin-tables/` | Pin reference. |
| **Docs** | `outputs/docs/` | Generated design docs. |
| **Nexar search results** | `knowledge-base/nexar/` | Part data from Nexar API. |
| **Ollama extractions** | `knowledge-base/ollama-extractions/` | Extracted specs from AI. |

---

## 7. Verify everything

Run the system check:

```bash
cd ai-easyeda-compiler
node cli.js status
```

You should see:

- Folders (inputs, outputs, rules-md, etc.) present.
- Critical files (compiler, converter, etc.) present.
- npm dependencies installed.
- Ollama installed and running.
- All 3 models (deepseek-r1:7b, llama3.1:8b, phi4:14b) listed.

---

## 8. Quick run

```bash
cd ai-easyeda-compiler
node cli.js compile          # compile from inputs/
node cli.js integrate       # integrate & convert
node cli.js search LM358     # Nexar product search (needs .env)
```

---

## Summary checklist

- [ ] Node.js 18+ installed (`node -v`)
- [ ] npm installed (`npm -v`)
- [ ] Ollama installed and running (`ollama list`)
- [ ] Models pulled: `deepseek-r1:7b`, `llama3.1:8b`, `phi4:14b`
- [ ] In `ai-easyeda-compiler`: `npm install`
- [ ] `.env` with Nexar token or client ID/secret (for product search)
- [ ] At least one markdown spec in `inputs/`
- [ ] `node cli.js status` passes

After that, the model is ready to run on your PC.
