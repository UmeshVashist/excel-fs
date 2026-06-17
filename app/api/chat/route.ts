import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const DEFAULT_GEMINI_KEY = process.env.GEMINI_API_KEY;
const DEFAULT_OPENAI_KEY = process.env.OPENAI_API_KEY;

function extractKeywords(text: string): string[] {
  const stopwords = [
    "what", "is", "my", "show", "me", "do", "i", "have", "the", "a", "an", 
    "for", "in", "on", "at", "to", "of", "and", "or", "but", "with", "about", 
    "how", "where", "when", "why", "who", "which", "can", "please", "find", 
    "search", "list", "get", "view", "tell", "select", "display", "all", 
    "any", "some", "your", "us", "we", "give", "you", "hi", "hello", "hey",
    "kese", "kise", "kare", "karen", "pe", "par", "bhi", "hai", "hain", "tha", 
    "thi", "the", "aur", "ya", "ko", "se", "me", "main", "ka", "ke", "ki",
    "use", "user", "users", "using", "used"
  ]
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .map(word => word.trim())
    .filter(word => word.length >= 2 && !stopwords.includes(word))
}

function getEditDistance(a: string, b: string): number {
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const matrix = []
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1  // deletion
          )
        )
      }
    }
  }
  return matrix[b.length][a.length]
}

function isFuzzyMatch(dbWord: string, queryWord: string): boolean {
  const dbLower = dbWord.toLowerCase()
  const queryLower = queryWord.toLowerCase()
  
  // Prevent opposites like install vs uninstall/unstall
  const isDbUninstall = dbLower.includes("uninstall") || dbLower.includes("unstall") || dbLower.includes("un-install")
  const isQueryUninstall = queryLower.includes("uninstall") || queryLower.includes("unstall") || queryLower.includes("un-install")
  const isDbInstallOnly = dbLower.includes("install") && !isDbUninstall
  const isQueryInstallOnly = queryLower.includes("install") && !isQueryUninstall
  
  if ((isDbUninstall && isQueryInstallOnly) || (isDbInstallOnly && isQueryUninstall)) {
    return false
  }

  const d = getEditDistance(dbLower, queryLower)
  if (queryWord.length <= 3) {
    return d === 0 // Exact match for short words like "ms", "sid", "sum"
  }
  if (queryWord.length <= 5) {
    return d <= 1 // Max 1 typo for medium words
  }
  return d <= 2 // Max 2 typos for long words
}

// Intent conflict checker to prevent false matches between uninstall and activation actions
function hasIntentConflict(queryKeywords: string[], item: any, primaryFields: string[], secondaryFields: string[]): boolean {
  const uninstallWords = ["uninstall", "remove", "delete", "unstall", "uninstallation", "uninstalling", "remover", "remove-ms-store", "clean", "cleanup"];
  const activateWords = ["activate", "activation", "active", "license", "key", "serial", "activated", "activator"];
  
  // 1. Check if the query asks for uninstall/remove/delete
  const queryHasUninstall = queryKeywords.some(kw => uninstallWords.some(w => isFuzzyMatch(w, kw)));
  // 2. Check if the query asks for activation/license
  const queryHasActivate = queryKeywords.some(kw => activateWords.some(w => isFuzzyMatch(w, kw)));
  
  if (!queryHasUninstall && !queryHasActivate) return false;
  
  // Collect all text from item fields to check its content
  const itemTextParts: string[] = [];
  for (const f of [...primaryFields, ...secondaryFields]) {
    if (item[f]) itemTextParts.push(item[f].toLowerCase());
  }
  const itemText = itemTextParts.join(" ");
  const itemWords = itemText.split(/[^\w]+/);
  
  const itemHasUninstall = itemWords.some(w => uninstallWords.some(uw => isFuzzyMatch(uw, w)));
  const itemHasActivate = itemWords.some(w => activateWords.some(aw => isFuzzyMatch(aw, w)));
  
  // Rule 1: If query explicitly asks for uninstall, but item has NO uninstall keywords, conflict!
  if (queryHasUninstall && !itemHasUninstall) {
    return true;
  }
  
  // Rule 2: If query explicitly asks for activation, but item has NO activation keywords, conflict!
  if (queryHasActivate && !itemHasActivate) {
    return true;
  }
  
  return false;
}

async function searchWeb(query: string): Promise<{ title: string; href: string; snippet: string }[]> {
  try {
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
      }
    })
    if (!res.ok) return []
    const html = await res.text()
    
    const results: { title: string; href: string; snippet: string }[] = []
    const resultBlocks = html.split('<div class="result__body">')
    
    for (let i = 1; i < resultBlocks.length && results.length < 5; i++) {
      const block = resultBlocks[i]
      
      const urlMatch = block.match(/<a class="result__url"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/)
      const snippetMatch = block.match(/<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/)
      
      if (urlMatch) {
        let href = urlMatch[1]
        if (href.startsWith("/l/?")) {
          const urlObj = new URL("https://html.duckduckgo.com" + href)
          const uddg = urlObj.searchParams.get("uddg")
          if (uddg) href = decodeURIComponent(uddg)
        }
        
        const title = urlMatch[2].replace(/<[^>]*>/g, "").trim()
        const snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]*>/g, "").trim() : ""
        
        if (title && href) {
          results.push({ title, href, snippet })
        }
      }
    }
    return results
  } catch (error) {
    console.error("[Search] Error scraping web search:", error)
    return []
  }
}

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const key = apiKey || DEFAULT_GEMINI_KEY
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    })
  })
  
  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Gemini API returned ${res.status}: ${errorText}`)
  }
  
  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    throw new Error("Invalid response structure from Gemini API")
  }
  return text
}

async function callOpenAI(prompt: string, apiKey: string): Promise<string> {
  const key = apiKey || DEFAULT_OPENAI_KEY
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    })
  })
  
  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`OpenAI API returned ${res.status}: ${errorText}`)
  }
  
  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content
  if (!text) {
    throw new Error("Invalid response structure from OpenAI API")
  }
  return text
}

export async function POST(req: Request) {
  const steps: string[] = []
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const {
      message,
      customGeminiKey,
      customOpenaiKey,
      selectedModel = "gemini", // "gemini" | "openai"
      enableDbSearch = true,
      enableWebSearch = true
    } = await req.json()

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    steps.push("User authenticated.")

    const cleanQuery = message.trim()
    const keywords = extractKeywords(cleanQuery)

    let databaseMatches: any = {
      formulas: [],
      notes: [],
      shortcuts: []
    }
    let hasDbMatches = false

    if (enableDbSearch && (keywords.length > 0 || cleanQuery.length > 2)) {
      steps.push("Searching DevBoard database...")
      
      const [formulasRes, notesRes, shortcutsRes] = await Promise.all([
        supabase.from("formulas").select("*").eq("user_id", user.id).eq("is_deleted", false),
        supabase.from("notes").select("*").eq("user_id", user.id).eq("is_deleted", false),
        supabase.from("shortcuts").select("*").eq("user_id", user.id).eq("is_deleted", false)
      ])

      const getMatchScore = (item: any, primaryFields: string[], secondaryFields: string[]) => {
        // 0. Check for action intent conflict (e.g. uninstall query vs activation record)
        if (hasIntentConflict(keywords, item, primaryFields, secondaryFields)) {
          return 0
        }

        const queryLower = cleanQuery.toLowerCase()
        
        // 1. Check for exact title match (extremely high confidence)
        if (item.title && item.title.toLowerCase() === queryLower) {
          return 100
        }
        
        // 2. Check for exact substring match in primary fields (if query is at least 3 chars)
        if (queryLower.length >= 3) {
          for (const pf of primaryFields) {
            const val = (item[pf] || "").toLowerCase()
            if (val && val.includes(queryLower)) {
              return 95
            }
          }
        }
        
        if (keywords.length === 0) return 0

        // 3. Check if any keyword matches a primary field EXACTLY (e.g. keyword "sid" matches title "SID")
        let hasExactPrimaryWordMatch = false
        for (const kw of keywords) {
          for (const pf of primaryFields) {
            const val = (item[pf] || "").toLowerCase().trim()
            if (val === kw) {
              hasExactPrimaryWordMatch = true
              break
            }
          }
          if (hasExactPrimaryWordMatch) break
        }
        
        if (hasExactPrimaryWordMatch) {
          return 90 // High confidence exact word match on title/shortcut (resolves "SID" issue)
        }
        
        // 4. Keyword matching with primary vs secondary weighting
        let primaryMatchCount = 0
        let secondaryMatchCount = 0
        
        for (const kw of keywords) {
          let foundInPrimary = false
          for (const pf of primaryFields) {
            const val = (item[pf] || "").toLowerCase()
            const words = val.split(/[^\w]+/)
            for (const w of words) {
              if (w && isFuzzyMatch(w, kw)) {
                foundInPrimary = true
                break
              }
            }
            if (foundInPrimary) break
          }
          
          if (foundInPrimary) {
            primaryMatchCount++
          } else {
            let foundInSecondary = false
            for (const sf of secondaryFields) {
              const val = (item[sf] || "").toLowerCase()
              const words = val.split(/[^\w]+/)
              for (const w of words) {
                if (w && isFuzzyMatch(w, kw)) {
                  foundInSecondary = true
                  break
                }
              }
              if (foundInSecondary) break
            }
            if (foundInSecondary) {
              secondaryMatchCount++
            }
          }
        }
        
        const totalMatchCount = primaryMatchCount + secondaryMatchCount
        
        if (keywords.length === 1) {
          if (primaryMatchCount === 1) return 80
        } else if (keywords.length === 2) {
          // If we have 2 keywords, BOTH must match, with at least one in primary
          if (primaryMatchCount >= 1 && totalMatchCount === 2) return 80
        } else {
          // If we have >=3 keywords, require at least 60% match ratio, with at least one in primary
          const matchRatio = totalMatchCount / keywords.length
          if (matchRatio >= 0.6 && primaryMatchCount >= 1) {
            return 70
          }
        }
        
        return 0
      }

      const filterAndSort = (res: any, primaryFields: string[], secondaryFields: string[]) => {
        if (!res.data) return []
        return res.data
          .map((item: any) => ({ item, score: getMatchScore(item, primaryFields, secondaryFields) }))
          .filter((x: any) => x.score > 0)
          .sort((a: any, b: any) => b.score - a.score)
          .map((x: any) => x.item)
          .slice(0, 5)
      }

      databaseMatches.formulas = filterAndSort(formulasRes, ["title", "formula"], ["description"])
      databaseMatches.notes = filterAndSort(notesRes, ["title"], ["description"])
      databaseMatches.shortcuts = filterAndSort(shortcutsRes, ["title", "shortcut"], ["description"])

      const totalCount = databaseMatches.formulas.length + 
                         databaseMatches.notes.length + 
                         databaseMatches.shortcuts.length
                          
      if (totalCount > 0) {
        hasDbMatches = true
        steps.push(`Found ${totalCount} matching record(s) in database.`)
      } else {
        steps.push("No matching records found in database.")
      }
    } else {
      steps.push("Database search skipped or no keywords extracted.")
    }

    let webResults: { title: string; href: string; snippet: string }[] = []
    let source: "database" | "llm_web" | "llm" = "llm"

    let prompt = ""

    if (hasDbMatches) {
      source = "database"
      steps.push("Constructing response using database matches...")
      
      prompt = `You are a helpful AI Assistant for DevBoard (a dashboard managing formulas, notes, and shortcuts).
The user asked: "${cleanQuery}"

We found these matching records in their personal database:
${JSON.stringify(databaseMatches, null, 2)}

Strict Guidelines:
1. Write a direct, precise, and extremely short answer (maximum 2-3 sentences).
2. Do not include conversational greetings, fluff, introductory phrases (e.g., "Sure, I can help with that", "Based on your database..."), or polite sign-offs.
3. For each matching database record, output its details in this exact format, with each field starting on its own separate line:
   **Title**: [Title]
   **Formula** (or **Shortcut** / **Note**): [Formula or Shortcut content / Note description]
   **Description**: [Description, if available]
4. Do NOT combine them onto the same line or use inline parentheses. Each label (**Title**, **Formula**, **Shortcut**, **Note**, **Description**) MUST start on a completely new line.
5. Format formulas/shortcuts inside code blocks (e.g. \`=VLOOKUP(...)\` or \`Get-Appx...\`).
6. Output only the formatted answer text itself.`
    } else {
      // Check if it's a generic greeting or conversational message
      const greetings = ["hi", "hello", "hey", "how are you", "who are you", "what is this", "what is devboard"]
      const isGreeting = greetings.some(g => cleanQuery.toLowerCase().startsWith(g)) || cleanQuery.length < 5

      if (enableWebSearch && !isGreeting) {
        source = "llm_web"
        steps.push(`Searching Google for "${cleanQuery}"...`)
        webResults = await searchWeb(cleanQuery)
        steps.push(`Scraped ${webResults.length} web search results.`)
        
        prompt = `You are a helpful AI Assistant for DevBoard. 
The user is asking: "${cleanQuery}"

We searched the web and found these snippets:
${webResults.map((r, i) => `[${i + 1}] Title: ${r.title}\nURL: ${r.href}\nSnippet: ${r.snippet}\n`).join("\n")}

Strict Guidelines:
1. Synthesize a direct, precise, and very short answer (maximum 2-3 sentences).
2. Do not include conversational greetings, fluff, intro phrases, or polite sign-offs.
3. Do NOT include any "Sources" list, references list, or external URLs. Answer the question directly in plain text/markdown.`
      } else {
        source = "llm"
        steps.push("Synthesizing general conversational answer...")
        prompt = `You are a helpful AI Assistant for DevBoard.
The user says: "${cleanQuery}"

Strict Guidelines:
1. Reply with a very short and direct answer (maximum 2 sentences).
2. Mention briefly that you can search their DevBoard formulas, notes, bookmarks, shortcuts, and tasks, or query the web.`
      }
    }

    let responseText = ""
    steps.push(`Invoking ${selectedModel === "openai" ? "OpenAI" : "Gemini"}...`)

    try {
      if (selectedModel === "openai") {
        responseText = await callOpenAI(prompt, customOpenaiKey)
      } else {
        responseText = await callGemini(prompt, customGeminiKey)
      }
    } catch (primaryError: any) {
      console.warn(`Primary model ${selectedModel} failed:`, primaryError.message)
      const fallbackModel = selectedModel === "openai" ? "gemini" : "openai"
      steps.push(`Primary model failed: ${primaryError.message || primaryError}. Trying fallback ${fallbackModel === "openai" ? "OpenAI" : "Gemini"}...`)
      
      try {
        if (fallbackModel === "openai") {
          responseText = await callOpenAI(prompt, customOpenaiKey)
        } else {
          responseText = await callGemini(prompt, customGeminiKey)
        }
      } catch (fallbackError: any) {
        console.error("Fallback model failed as well:", fallbackError.message)
        steps.push("Both models failed. Generating resilient warning text.")
        
        if (hasDbMatches) {
          let listText = `I found these matching records in your DevBoard Database:\n\n`
          if (databaseMatches.formulas.length > 0) {
            listText += `**Formulas:**\n`
            databaseMatches.formulas.forEach((f: any) => {
              listText += `**Title**: ${f.title}\n**Formula**: \`${f.formula}\`\n${f.description ? `**Description**: ${f.description}\n` : ""}\n`
            })
          }
          if (databaseMatches.notes.length > 0) {
            listText += `\n**Notes:**\n`
            databaseMatches.notes.forEach((n: any) => {
              listText += `**Title**: ${n.title}\n**Note**: ${n.description}\n\n`
            })
          }
          if (databaseMatches.shortcuts.length > 0) {
            listText += `\n**Shortcuts:**\n`
            databaseMatches.shortcuts.forEach((s: any) => {
              listText += `**Title**: ${s.title}\n**Shortcut**: \`${s.shortcut}\`\n${s.description ? `**Description**: ${s.description}\n` : ""}\n`
            })
          }
          responseText = listText
        } else if (webResults.length > 0) {
          let listText = `I found these Web Search results for you:\n\n`
          webResults.forEach((r: any, i: number) => {
            listText += `${i + 1}. **${r.title}**\n[${r.href}](${r.href})\n*${r.snippet}*\n\n`
          })
          responseText = listText
        } else {
          responseText = `⚠️ **AI Service Temporarily Unavailable**

I couldn't find a match in your personal database, and the default AI models are currently rate-limited or out of quota.

Please add your own custom API key in the settings menu (gear icon at the top right) to chat without limits, or try again later.`
        }
      }
    }

    steps.push("Response synthesized successfully.")

    return NextResponse.json({
      message: responseText,
      source,
      databaseMatches,
      webResults,
      steps
    })
  } catch (error: any) {
    console.error("[Chat API Error]:", error)
    steps.push(`Error encountered: ${error.message || error}`)
    return NextResponse.json({
      error: error.message || "An unexpected error occurred in the chat assistant API",
      steps
    }, { status: 500 })
  }
}
