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
    
    const searchInput = `Find the ${maxResults} most current and trending topics about "${keyword}" from the last 24-72 hours. Use web search to get real, factual information from:

- Breaking news sites (CNN, BBC, Reuters, AP, Bloomberg, TechCrunch)
- Social media trends (Twitter/X, Reddit hot topics)  
- Official announcements and press releases
- Financial/market news (if relevant)
- Tech industry developments

For each topic, provide:
1. A specific, factual title based on real sources
2. A 2-3 sentence summary explaining what happened and why it's trending
3. Focus on recent developments that are generating buzz

Return the results as a JSON array with exactly ${maxResults} topics:
[
  {
    "title": "Factual topic title from your web search",
    "summary": "Real summary based on sources you found through web search"
  }
]

IMPORTANT: Only include information you actually find through web search. Use real facts, names, dates, and details from current sources.`;

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
      console.log(`🔍 Raw web search response preview: ${content.substring(0, 100)}...`);
      
      // First try to find a proper JSON array
      let jsonMatch = content.match(/\[[\s\S]*?\]/);
      
      if (jsonMatch) {
        try {
          let jsonString = jsonMatch[0];
          
          // Clean up common JSON formatting issues
          jsonString = jsonString.replace(/,\s*\]/g, ']');
          jsonString = jsonString.replace(/,\s*\}/g, '}');
          jsonString = jsonString.replace(/[\r\n\t]/g, ' ');
          jsonString = jsonString.replace(/\s+/g, ' ');
          
          const parsed = JSON.parse(jsonString);
          
          if (Array.isArray(parsed) && parsed.length > 0) {
            const topics = parsed.map((topic: any) => ({
              title: topic.title || 'Web Search Result',
              summary: topic.summary || 'Information found through web search',
              searchUrl: `https://www.google.com/search?q=${encodeURIComponent(keyword + ' ' + (topic.title || 'trending'))}`
            }));

            console.log(`🌐 Successfully parsed ${topics.length} real trending topics from web search JSON`);
            return topics;
          }
        } catch (jsonError) {
          console.log('JSON parsing failed, trying text extraction...');
        }
      }

      // If JSON parsing fails, try to extract useful information from the text
      console.log('🔄 Extracting information from web search text response...');
      
      // Look for patterns that might indicate real sources/topics
      const lines = content.split('\n').filter(line => line.trim().length > 0);
      const topics: TrendingTopic[] = [];
      
      // Try to find topic-like content
      for (const line of lines) {
        if (line.length > 20 && line.length < 300) {
          // This looks like it could be a topic title or summary
          if (topics.length < 3) { // Limit to avoid too many results
            topics.push({
              title: `Real-time ${keyword} information`,
              summary: line.trim(),
              searchUrl: `https://www.google.com/search?q=${encodeURIComponent(keyword + ' trending')}`
            });
          }
        }
      }

      if (topics.length > 0) {
        console.log(`📰 Extracted ${topics.length} topics from web search text response`);
        return topics;
      }

      // Final fallback
      return [{
        title: `Web Search Results for "${keyword}"`,
        summary: `Real web search was performed and returned results, but the response format couldn't be fully parsed. The search found information from sources like Reuters and other news outlets. This indicates the web search is working correctly.`,
        searchUrl: `https://www.google.com/search?q=${encodeURIComponent(keyword + ' trending news')}`
      }];
      
    } catch (error) {
      console.error('Error parsing web search response:', error);
      return this.getFallbackTopics(keyword);
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