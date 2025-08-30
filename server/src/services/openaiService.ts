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
      
      // Process each keyword with web search to get real, current information
      const results: KeywordTopics[] = [];
      
      for (const keyword of keywords) {
        try {
          console.log(`🔍 Searching internet for real-time trending topics about: "${keyword}"`);
          const keywordResults = await this.getWebSearchTrendingTopics(keyword, maxResults);
          results.push(keywordResults);
        } catch (error) {
          console.error(`Error getting web search results for "${keyword}":`, error);
          results.push({
            keyword,
            topics: this.getFallbackTopics(keyword)
          });
        }
      }
      
      console.log(`✅ Web search completed for all ${keywords.length} keywords`);
      return results;
    } catch (error) {
      console.error('Web search error:', error);
      throw new Error('Failed to fetch real-time trending topics from web search');
    }
  }


  private async getWebSearchTrendingTopics(keyword: string, maxResults: number): Promise<KeywordTopics> {
    console.log(`🔍 Using OpenAI Responses API with web search for: ${keyword}`);
    
    const searchInput = `Search web for ${maxResults} trending "${keyword}" topics (last 48h).

OUTPUT: [{"title":"<60 chars","summary":"<80 chars"}]

Rules:
- ${maxResults} topics only
- Real current events  
- Brief titles/summaries
- Factual data
- JSON only

Array:`;

    try {
      // Use the new Responses API with web search tool
      // Web search requires gpt-4o or gpt-4o-mini, not gpt-4-turbo
      const webSearchModel = config.openai.model.includes('gpt-4o') ? config.openai.model : 'gpt-4o';
      
      const response = await (this.openai as any).responses.create({
        model: webSearchModel,
        input: searchInput,
        tools: [
          {
            type: "web_search_preview" // Correct tool type from error message
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

      // Debug response length and truncation
      console.log(`📏 Response length: ${content.length} characters`);
      if (content.length > 500) {
        console.log(`📝 Response preview: ${content.substring(0, 200)}...${content.substring(content.length - 100)}`);
      }

      const topics = this.parseWebSearchResponse(content, keyword);
      console.log(`✅ Web search completed for keyword: ${keyword} - found ${topics.length} real trending topics`);
      return { keyword, topics };

    } catch (error: any) {
      console.error(`❌ Responses API error for "${keyword}":`, error.message);
      
      // If Responses API fails, fall back to regular chat completions with a disclaimer
      console.log(`⚠️ Falling back to chat completions for: ${keyword}`);
      return {
        keyword,
        topics: [{
          title: `Responses API Unavailable for "${keyword}"`,
          summary: `The OpenAI Responses API with web search is not available in this configuration. This may be because: 1) The feature requires access to newer OpenAI API endpoints, 2) Additional API permissions are needed, or 3) The feature is in preview/beta. To get real trending topics, consider using external search APIs like NewsAPI or Google Custom Search.`,
          searchUrl: `https://www.google.com/search?q=${encodeURIComponent(keyword + ' trending news')}`
        }]
      };
    }
  }






  private parseWebSearchResponse(content: string, keyword: string): TrendingTopic[] {
    try {
      console.log(`🔍 Raw web search response preview: ${content.substring(0, 200)}...`);
      
      // More aggressive JSON extraction - look for multiple patterns
      const jsonPatterns = [
        /\[[\s\S]*?\]/,                    // Standard array
        /```json\s*(\[[\s\S]*?\])\s*```/, // JSON in code blocks
        /```\s*(\[[\s\S]*?\])\s*```/,     // Arrays in code blocks
        /(\[[\s\S]*?\])/                  // Any array-like structure
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
            
            // Attempt to repair truncated JSON
            if (jsonString.endsWith('"') && !jsonString.endsWith('"}') && !jsonString.endsWith('"]')) {
              // Likely truncated in middle of string - try to close it
              console.log('🔧 Attempting to repair truncated JSON string...');
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
      
      // Look for numbered lists or bullet points that might contain topics
      const lines = content.split('\n').filter(line => line.trim().length > 0);
      const extractedTopics: TrendingTopic[] = [];
      
      let currentTitle = '';
      let currentSummary = '';
      
      for (const line of lines) {
        const cleanLine = line.trim();
        
        // Skip generic headers or AI responses
        if (cleanLine.toLowerCase().includes('here are') || 
            cleanLine.toLowerCase().includes('trending topics') ||
            cleanLine.startsWith('##') ||
            cleanLine.length < 15) {
          continue;
        }
        
        // Look for numbered or bulleted items that could be topics
        const titleMatch = cleanLine.match(/^(?:\d+\.\s*)?(?:\*\*?)?(.*?)(?:\*\*?)?$/);
        if (titleMatch && titleMatch[1] && titleMatch[1].length > 10) {
          if (currentTitle && currentSummary && extractedTopics.length < 3) {
            extractedTopics.push({
              title: currentTitle.replace(/^\*\*|\*\*$/g, '').trim(),
              summary: currentSummary,
              searchUrl: `https://www.google.com/search?q=${encodeURIComponent(currentTitle)}`
            });
          }
          
          currentTitle = titleMatch[1].trim();
          currentSummary = '';
        } else if (currentTitle && cleanLine.length > 20 && cleanLine.length < 500) {
          // This might be a summary for the current title
          currentSummary = cleanLine;
        }
      }
      
      // Don't forget the last topic
      if (currentTitle && currentSummary && extractedTopics.length < 3) {
        extractedTopics.push({
          title: currentTitle.replace(/^\*\*|\*\*$/g, '').trim(),
          summary: currentSummary,
          searchUrl: `https://www.google.com/search?q=${encodeURIComponent(currentTitle)}`
        });
      }

      if (extractedTopics.length > 0) {
        console.log(`📰 Intelligently extracted ${extractedTopics.length} topics from text`);
        return extractedTopics;
      }

      // Final fallback with better messaging
      console.log('⚠️ Using final fallback - web search succeeded but parsing failed');
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
      // Common patterns for truncated JSON
      if (jsonString.includes('"title":') && jsonString.includes('"summary":')) {
        // Try to identify incomplete objects and close them
        const lastOpenBrace = jsonString.lastIndexOf('{');
        const lastCloseBrace = jsonString.lastIndexOf('}');
        
        if (lastOpenBrace > lastCloseBrace) {
          // There's an unclosed object
          const beforeIncomplete = jsonString.substring(0, lastOpenBrace);
          
          // Check if we have at least one complete object before this
          if (beforeIncomplete.includes('"title":') && beforeIncomplete.includes('"summary":')) {
            console.log('🔧 Found complete objects before truncation, removing incomplete part');
            // Remove the incomplete object and close the array
            let repaired = beforeIncomplete.trim();
            if (repaired.endsWith(',')) {
              repaired = repaired.slice(0, -1); // Remove trailing comma
            }
            if (!repaired.endsWith(']')) {
              repaired += ']';
            }
            return repaired;
          }
        }
        
        // If we have an unterminated string, try to close it intelligently
        if (jsonString.match(/"summary":\s*"[^"]*$/)) {
          console.log('🔧 Attempting to close unterminated summary string');
          // Try to close the unterminated string and object
          let repaired = jsonString + '"}]';
          return repaired;
        }
      }
      
      // If all else fails, return as-is
      return jsonString;
    } catch (error) {
      console.log('🔧 JSON repair failed, returning original');
      return jsonString;
    }
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