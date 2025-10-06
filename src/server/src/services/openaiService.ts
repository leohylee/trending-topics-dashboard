import OpenAI from 'openai';
import { config } from '../config';
import { TrendingTopic } from '../types';

interface KeywordTopics {
  keyword: string;
  topics: TrendingTopic[];
}

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openaiApiKey,
    });
  }

  async getTrendingTopics(keywords: string[], maxResults: number = 3): Promise<KeywordTopics[]> {
    try {
      console.log(`🌐 WEB SEARCH MODE: Fetching real-time trending information from the internet for ${keywords.length} keywords`);

      // Process keywords in parallel with timeout protection
      const timeoutMs = 25000; // 25 seconds timeout per keyword (API can be slow)
      const results = await Promise.all(
        keywords.map(async (keyword) => {
          try {
            console.log(`🔍 Searching internet for real-time trending topics about: "${keyword}"`);
            const keywordResults = await this.withTimeout(
              this.getWebSearchTrendingTopics(keyword, maxResults),
              timeoutMs,
              keyword
            );
            return keywordResults;
          } catch (error) {
            console.error(`Error getting web search results for "${keyword}":`, error);
            return {
              keyword,
              topics: this.getFallbackTopics(keyword)
            };
          }
        })
      );

      console.log(`✅ Web search completed for all ${keywords.length} keywords`);
      return results;
    } catch (error) {
      console.error('Web search error:', error);
      throw new Error('Failed to fetch real-time trending topics from web search');
    }
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    keyword: string
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => {
          reject(new Error(`Timeout after ${timeoutMs}ms for keyword: ${keyword}`));
        }, timeoutMs)
      )
    ]);
  }


  private async getWebSearchTrendingTopics(keyword: string, maxResults: number): Promise<KeywordTopics> {
    console.log(`🔍 Using OpenAI Responses API with web search for: ${keyword}`);

    const searchInput = `You are a news aggregator. Search the web and find ${maxResults} recent trending topics about "${keyword}".

For each topic, provide:
1. A clear, specific title
2. A 2-3 sentence summary

Return ONLY a JSON array with this EXACT structure (no markdown, no code blocks, no extra text):
[
  {"title": "First trending topic title", "summary": "First topic summary with details about what's happening."},
  {"title": "Second trending topic title", "summary": "Second topic summary with details about what's happening."},
  {"title": "Third trending topic title", "summary": "Third topic summary with details about what's happening."}
]

Focus on: current news, trending discussions, recent developments, breaking stories.
Return ONLY the JSON array - nothing else.`;

    try {
      // Use the Responses API with web search tool
      // Web search is supported by gpt-4o, gpt-4o-mini, and gpt-4.1 series
      const webSearchModel = config.openai.model;
      
      const response = await (this.openai as any).responses.create({
        model: webSearchModel,
        input: searchInput,
        tools: [
          {
            type: "web_search_preview"
          }
        ]
      });


      let content: string;
      if (response.output_text) {
        content = response.output_text;
      } else if (response.output) {
        content = response.output;
      } else {
        throw new Error('No content received from OpenAI Responses API');
      }

      console.log(`📏 Response length: ${content.length} characters`);
      if (content.length > 0) {
        console.log(`🔍 Response preview (first 300 chars): ${content.substring(0, 300)}`);
        console.log(`🔍 Response end (last 100 chars): ${content.substring(Math.max(0, content.length - 100))}`);
      }
      
      const topics = this.parseWebSearchResponse(content, keyword, maxResults);
      console.log(`✅ Web search completed for keyword: ${keyword} - found ${topics.length} real trending topics`);
      
      return {
        keyword,
        topics,
      };

    } catch (error: any) {
      console.error(`❌ Responses API error for "${keyword}":`, error.message);

      // Fallback to Chat Completions API without web search
      console.log(`🔄 Falling back to Chat Completions API for "${keyword}"`);
      try {
        const fallbackTopics = await this.getChatCompletionFallback(keyword, maxResults);
        return {
          keyword,
          topics: fallbackTopics
        };
      } catch (fallbackError: any) {
        console.error(`❌ Fallback API also failed for "${keyword}":`, fallbackError.message);

        // Return final fallback message
        return {
          keyword,
          topics: [{
            title: `Unable to fetch ${keyword} topics`,
            summary: `Both web search and fallback APIs are temporarily unavailable. Please try again in a few moments.`,
            searchUrl: `https://www.google.com/search?q=${encodeURIComponent(keyword + ' trending news')}`
          }]
        };
      }
    }
  }

  private async getChatCompletionFallback(keyword: string, maxResults: number): Promise<TrendingTopic[]> {
    console.log(`🤖 Using Chat Completions API (no web search) for: ${keyword}`);

    const prompt = `Provide ${maxResults} trending topics related to "${keyword}" based on your training data.

Return ONLY a JSON array in this exact format:
[
  {"title": "Topic title", "summary": "Topic summary"},
  {"title": "Topic title", "summary": "Topic summary"},
  {"title": "Topic title", "summary": "Topic summary"}
]

No explanations, no markdown, just the JSON array.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant that returns only JSON arrays.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const content = response.choices[0]?.message?.content || '[]';
      const topics = this.parseWebSearchResponse(content, keyword, maxResults);

      console.log(`✅ Chat Completions fallback successful for: ${keyword} - found ${topics.length} topics`);
      return topics.length > 0 ? topics : this.getFallbackTopics(keyword);

    } catch (error: any) {
      console.error(`❌ Chat Completions fallback error:`, error.message);
      throw error;
    }
  }







  private parseWebSearchResponse(content: string, keyword: string, maxResults: number = 3): TrendingTopic[] {
    try {
      console.log(`🔍 Parsing web search response for keyword: ${keyword}`);
      console.log(`🔍 Content length: ${content.length} characters`);
      console.log(`🔍 First 200 chars: ${content.substring(0, 200)}`);
      
      // More comprehensive JSON extraction patterns
      const jsonPatterns = [
        /\[[\s\S]*?\]/,                    // Standard array anywhere
        /```json\s*(\[[\s\S]*?\])\s*```/, // JSON in code blocks
        /```\s*(\[[\s\S]*?\])\s*```/,     // Arrays in code blocks
        /(\[[\s\S]*?\])/,                  // Any array-like structure
        /JSON ARRAY:\s*(\[[\s\S]*?\])/,   // After "JSON ARRAY:" prompt
        /Here are.*?(\[[\s\S]*?\])/i,     // After "Here are" text
        /topics.*?(\[[\s\S]*?\])/i        // After "topics" text
      ];

      for (const pattern of jsonPatterns) {
        const match = content.match(pattern);
        if (match) {
          try {
            let jsonString = match[1] || match[0];
            
            // Comprehensive JSON cleaning
            jsonString = jsonString.replace(/```json|```/g, '');     // Remove code blocks
            jsonString = jsonString.replace(/,\s*\]/g, ']');         // Trailing commas in arrays
            jsonString = jsonString.replace(/,\s*\}/g, '}');         // Trailing commas in objects
            jsonString = jsonString.replace(/[\r\n\t]/g, ' ');       // Remove line breaks/tabs
            jsonString = jsonString.replace(/\s+/g, ' ');            // Multiple spaces to single
            jsonString = jsonString.replace(/"\s*:\s*"/g, '":"');    // Fix spacing around colons
            jsonString = jsonString.trim();
            
            // Enhanced truncation detection and repair
            const isTruncated = (
              jsonString.endsWith('"') && !jsonString.endsWith('"}') && !jsonString.endsWith('"]') ||
              jsonString.includes('{"title"') && !jsonString.trim().endsWith(']') ||
              jsonString.match(/\{\s*"title".*"summary".*[^}]$/) || // Ends without closing brace
              (jsonString.match(/\{/g) || []).length > (jsonString.match(/\}/g) || []).length // More opens than closes
            );

            if (isTruncated) {
              console.log('🔧 Detected truncated JSON, attempting repair...');
              jsonString = this.repairTruncatedJson(jsonString);
            }
            
            console.log(`🧹 Cleaned JSON: ${jsonString.substring(0, 100)}...`);
            
            const parsed = JSON.parse(jsonString);
            
            if (Array.isArray(parsed) && parsed.length > 0) {
              // Validate that each item has proper structure
              const validTopics = parsed.filter(topic => 
                topic && 
                typeof topic === 'object' && 
                topic.title && 
                topic.summary &&
                typeof topic.title === 'string' &&
                typeof topic.summary === 'string' &&
                topic.title.trim().length > 5 &&
                topic.summary.trim().length > 10
              );

              if (validTopics.length > 0) {
                const topics = validTopics.map((topic: any) => ({
                  title: topic.title.trim(),
                  summary: topic.summary.trim(),
                  searchUrl: `https://www.google.com/search?q=${encodeURIComponent(topic.title.trim())}`
                }));

                console.log(`🌐 Successfully parsed ${topics.length} valid trending topics from JSON`);
                return topics;
              }
            }
          } catch (jsonError: any) {
            console.log(`❌ JSON parsing failed for pattern ${jsonPatterns.indexOf(pattern)}: ${jsonError.message || String(jsonError)}`);
            
            // Try to extract individual valid objects even from broken JSON
            if (jsonError.message?.includes('Unterminated string')) {
              console.log('🔧 Attempting to extract valid objects from corrupted JSON...');
              const extractedTopics = this.extractValidObjectsFromCorruptedJson(match[1] || match[0], keyword);
              if (extractedTopics.length > 0) {
                console.log(`🌟 Successfully extracted ${extractedTopics.length} topics from corrupted JSON`);
                return extractedTopics;
              }
            }
          }
        }
      }

      // Enhanced text extraction as fallback
      console.log('🔄 Attempting intelligent text extraction...');

      // Split by common delimiters and clean
      const segments = content.split(/\n\n+|\n(?=\d+\.)/);
      const extractedTopics: TrendingTopic[] = [];

      for (const segment of segments) {
        if (extractedTopics.length >= maxResults) break;

        const cleanSegment = segment.trim();
        if (cleanSegment.length < 20) continue;

        // Try to extract structured data from various formats
        // Pattern 1: Numbered items "1. Title - Summary" or "1. Title: Summary"
        const numberedMatch = cleanSegment.match(/^\d+\.\s*([^\n\-:]+)[\-:]\s*(.+)/s);
        if (numberedMatch && numberedMatch[1] && numberedMatch[2]) {
          extractedTopics.push({
            title: numberedMatch[1].trim().replace(/^\*\*|\*\*$/g, ''),
            summary: numberedMatch[2].trim().replace(/^\*\*|\*\*$/g, '').substring(0, 300),
            searchUrl: `https://www.google.com/search?q=${encodeURIComponent(numberedMatch[1].trim())}`
          });
          continue;
        }

        // Pattern 2: Bold title followed by text "**Title** text..."
        const boldMatch = cleanSegment.match(/^\*\*([^\*]+)\*\*\s+(.+)/s);
        if (boldMatch && boldMatch[1] && boldMatch[2]) {
          extractedTopics.push({
            title: boldMatch[1].trim(),
            summary: boldMatch[2].trim().substring(0, 300),
            searchUrl: `https://www.google.com/search?q=${encodeURIComponent(boldMatch[1].trim())}`
          });
          continue;
        }

        // Pattern 3: Title on one line, summary on next
        const lines = cleanSegment.split('\n').filter(l => l.trim().length > 0);
        if (lines.length >= 2) {
          const potentialTitle = lines[0].trim().replace(/^\d+\.\s*|\*\*|^-\s*/g, '');
          const potentialSummary = lines.slice(1).join(' ').trim().replace(/^\*\*|\*\*$/g, '');

          if (potentialTitle.length > 10 && potentialTitle.length < 150 &&
              potentialSummary.length > 20 && potentialSummary.length < 500) {
            extractedTopics.push({
              title: potentialTitle,
              summary: potentialSummary.substring(0, 300),
              searchUrl: `https://www.google.com/search?q=${encodeURIComponent(potentialTitle)}`
            });
            continue;
          }
        }
      }

      if (extractedTopics.length > 0) {
        console.log(`📰 Intelligently extracted ${extractedTopics.length} topics from text`);
        return extractedTopics;
      }

      // If we still have nothing, try one more aggressive extraction
      console.log('🔧 Attempting aggressive text mining...');
      const aggressiveTopics = this.aggressiveTextMining(content, keyword, maxResults);
      if (aggressiveTopics.length > 0) {
        console.log(`🎯 Extracted ${aggressiveTopics.length} topics via aggressive mining`);
        return aggressiveTopics;
      }

      // Final fallback with better messaging
      console.log('⚠️ Using final fallback - web search succeeded but parsing failed');
      console.log(`📄 Full response for debugging: ${content.substring(0, 500)}`);
      return [{
        title: `Current ${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Developments`,
        summary: `Web search successfully found current information about ${keyword}, but the response format requires manual review. The system detected real sources and current data.`,
        searchUrl: `https://www.google.com/search?q=${encodeURIComponent(keyword + ' latest news')}`
      }];
      
    } catch (error) {
      console.error('Error parsing web search response:', error);
      return this.getFallbackTopics(keyword);
    }
  }



  private extractValidObjectsFromCorruptedJson(jsonString: string, keyword: string): TrendingTopic[] {
    try {
      const topics: TrendingTopic[] = [];
      
      // Look for complete objects in the string, even if the overall JSON is broken
      const objectPattern = /\{\s*"title"\s*:\s*"([^"]+)"\s*,\s*"summary"\s*:\s*"([^"]+)"\s*\}/g;
      let match;
      
      while ((match = objectPattern.exec(jsonString)) !== null && topics.length < 5) {
        if (match[1] && match[2] && match[1].length > 5 && match[2].length > 10) {
          topics.push({
            title: match[1].trim(),
            summary: match[2].trim(),
            searchUrl: `https://www.google.com/search?q=${encodeURIComponent(keyword + ' ' + match[1].trim())}`
          });
        }
      }
      
      // Also try to find objects with line breaks in summaries
      const multiLinePattern = /\{\s*"title"\s*:\s*"([^"]+)"\s*,\s*"summary"\s*:\s*"([^"]*(?:[^"\\]|\\.)*?)"\s*\}/gs;
      let multiMatch: RegExpExecArray | null;
      
      while ((multiMatch = multiLinePattern.exec(jsonString)) !== null && topics.length < 5) {
        if (multiMatch[1] && multiMatch[2] && multiMatch[1].length > 5 && multiMatch[2].length > 10) {
          // Make sure this isn't a duplicate
          const isDuplicate = topics.some(topic => topic.title === multiMatch![1].trim());
          if (!isDuplicate) {
            topics.push({
              title: multiMatch[1].trim(),
              summary: multiMatch[2].trim().replace(/\\"/g, '"'), // Unescape quotes
              searchUrl: `https://www.google.com/search?q=${encodeURIComponent(keyword + ' ' + multiMatch[1].trim())}`
            });
          }
        }
      }
      
      return topics;
    } catch (error) {
      console.log('🔧 Object extraction from corrupted JSON failed');
      return [];
    }
  }

  private repairTruncatedJson(jsonString: string): string {
    try {
      console.log('🔧 Attempting to repair truncated JSON...');

      // Extract complete objects using more flexible regex patterns
      const completeObjects: any[] = [];

      // Enhanced patterns to match objects with possible additional fields
      const patterns = [
        // Standard pattern with title and summary
        /\{\s*"title"\s*:\s*"([^"]+)"\s*,\s*"summary"\s*:\s*"([^"]+)"\s*(?:,\s*"[^"]*"\s*:\s*"[^"]*")*\s*\}/g,
        // Pattern for objects with URL field
        /\{\s*"title"\s*:\s*"([^"]+)"\s*,\s*"summary"\s*:\s*"([^"]+)"\s*,\s*"url"\s*:\s*"[^"]+"\s*(?:,\s*"[^"]*"\s*:\s*"[^"]*")*\s*\}/g,
        // Pattern for objects with image_query field
        /\{\s*"title"\s*:\s*"([^"]+)"\s*,\s*"summary"\s*:\s*"([^"]+)"\s*,\s*"url"\s*:\s*"[^"]+"\s*,\s*"image_query"\s*:\s*"[^"]+"\s*\}/g
      ];

      for (const pattern of patterns) {
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(jsonString)) !== null && completeObjects.length < 10) {
          if (match[1] && match[2] && match[1].length > 3 && match[2].length > 10) {
            // Check if this title is already added to avoid duplicates
            const isDuplicate = completeObjects.some(obj => obj.title === match![1].trim());
            if (!isDuplicate) {
              completeObjects.push({
                title: match[1].trim(),
                summary: match[2].trim()
              });
            }
          }
        }
      }

      if (completeObjects.length > 0) {
        console.log(`🔧 Extracted ${completeObjects.length} complete objects from truncated JSON`);
        return JSON.stringify(completeObjects);
      }

      // Fallback: try to close truncated structure
      if (jsonString.includes('"title":') && jsonString.includes('"summary":')) {
        // Find the last complete object and truncate everything after it
        const lastCompleteObjectEnd = jsonString.lastIndexOf('}');
        if (lastCompleteObjectEnd > -1) {
          // Extract everything up to the last complete object
          let truncatedToLastObject = jsonString.substring(0, lastCompleteObjectEnd + 1);

          // If it doesn't end with ] and we're in an array, add it
          if (!truncatedToLastObject.trim().endsWith(']') && truncatedToLastObject.includes('[')) {
            // Remove any trailing comma and close the array
            truncatedToLastObject = truncatedToLastObject.replace(/,\s*$/, '') + ']';
          }

          console.log('🔧 Truncated to last complete object and closed JSON');
          return truncatedToLastObject;
        }
      }

      // If all else fails, return as-is
      return jsonString;
    } catch (error) {
      console.log('🔧 JSON repair failed, returning original');
      return jsonString;
    }
  }

  private aggressiveTextMining(content: string, _keyword: string, maxResults: number): TrendingTopic[] {
    const topics: TrendingTopic[] = [];

    // Split content into sentences
    const sentences = content
      .replace(/\n/g, ' ')
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 30 && s.length < 400);

    // Group sentences into potential topics
    for (let i = 0; i < sentences.length && topics.length < maxResults; i += 2) {
      const title = sentences[i];
      const summary = sentences[i + 1] || sentences[i];

      // Basic quality checks
      if (title && summary &&
          !title.toLowerCase().includes('here are') &&
          !title.toLowerCase().includes('trending topics') &&
          !title.toLowerCase().includes('json array')) {

        // Extract a clean title (first clause or up to 100 chars)
        const cleanTitle = title.split(/,|;/)[0].trim().substring(0, 100);

        if (cleanTitle.length > 15) {
          topics.push({
            title: cleanTitle,
            summary: summary.trim().substring(0, 250),
            searchUrl: `https://www.google.com/search?q=${encodeURIComponent(cleanTitle)}`
          });
        }
      }
    }

    return topics;
  }

  private getFallbackTopics(keyword: string): TrendingTopic[] {
    return [
      {
        title: `Latest ${keyword} Updates`,
        summary: `Stay updated with the latest developments and news about ${keyword}. Check back later for fresh trending topics.`,
        searchUrl: `https://www.google.com/search?q=${encodeURIComponent(keyword)}`
      }
    ];
  }
}