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
      // Single keyword - always use individual processing
      if (keywords.length === 1) {
        const result = await this.getSingleKeywordTopics(keywords[0], maxResults);
        return [result];
      }
      
      // Multiple keywords - choose strategy based on risk assessment
      const shouldUseBatch = this.shouldUseBatchProcessing(keywords, maxResults);
      
      if (shouldUseBatch) {
        console.log(`💰 Using batch processing for ${keywords.length} keywords (1x API call, cost efficient)`);
        try {
          return await this.getBatchKeywordTopics(keywords, maxResults);
        } catch (error) {
          console.warn(`⚠️ Batch processing failed after 1 API call, now making ${keywords.length} more calls:`, error instanceof Error ? error.message : String(error));
          console.warn(`💸 Total cost: ${1 + keywords.length} API calls instead of ${keywords.length} (overhead due to batch failure)`);
          // Fall back to individual processing
          return await this.getIndividualKeywordTopics(keywords, maxResults);
        }
      } else {
        console.log(`🎯 Skipping batch processing (high failure risk), using individual processing for ${keywords.length} keywords`);
        return await this.getIndividualKeywordTopics(keywords, maxResults);
      }
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error('Failed to fetch trending topics from OpenAI');
    }
  }

  private shouldUseBatchProcessing(keywords: string[], maxResults: number): boolean {
    // Risk factors that increase batch processing failure rate
    const totalTopics = keywords.length * maxResults;
    const estimatedTokens = totalTopics * 100; // rough estimate per topic
    
    // Don't use batch if:
    // 1. Too many total topics (increases JSON complexity and size)
    // 2. Estimated tokens too high (increases truncation risk)
    // 3. Too many keywords (increases parsing complexity)
    
    if (totalTopics > 12) {
      console.log(`📊 Risk assessment: ${totalTopics} total topics may cause JSON parsing issues`);
      return false;
    }
    
    if (estimatedTokens > 2000) {
      console.log(`📊 Risk assessment: ~${estimatedTokens} estimated tokens may cause truncation`);
      return false;
    }
    
    if (keywords.length > 3) {
      console.log(`📊 Risk assessment: ${keywords.length} keywords increases parsing complexity`);
      return false;
    }
    
    console.log(`📊 Risk assessment: Batch processing safe for ${keywords.length} keywords, ${totalTopics} topics`);
    return true;
  }

  private async getIndividualKeywordTopics(keywords: string[], maxResults: number): Promise<KeywordTopics[]> {
    console.log(`📞 Processing ${keywords.length} keywords individually (${keywords.length}x API calls, higher cost, more reliable)`);
    const results: KeywordTopics[] = [];
    
    for (const keyword of keywords) {
      try {
        const keywordResults = await this.getSingleKeywordTopics(keyword, maxResults);
        results.push(keywordResults);
      } catch (error) {
        console.error(`Error processing keyword "${keyword}":`, error);
        results.push({
          keyword,
          topics: this.getFallbackTopics(keyword)
        });
      }
    }
    
    console.log(`🎯 Individual processing completed: ${keywords.length} API calls made`);
    return results;
  }

  private async getBatchKeywordTopics(keywords: string[], maxResults: number): Promise<KeywordTopics[]> {
    const prompt = this.buildBatchPrompt(keywords, maxResults);
    
    const completion = await this.openai.chat.completions.create({
      model: config.openai.model,
      messages: [
        {
          role: 'system',
          content: `You are an elite trending topics analyst with real-time awareness of global digital conversations. You excel at identifying what's HOT right now and providing engaging summaries that explain both WHAT is trending and WHY it matters.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: config.openai.temperature,
      max_tokens: Math.min(config.openai.maxTokens, keywords.length * maxResults * 180),
      presence_penalty: config.openai.presencePenalty,
      frequency_penalty: config.openai.frequencyPenalty
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from OpenAI API');
    }

    const result = this.parseBatchResponse(content, keywords);
    console.log(`✅ Batch processing succeeded for ${keywords.length} keywords (1x API call saved ~67% cost)`);
    return result;
  }

  private async getSingleKeywordTopics(keyword: string, maxResults: number): Promise<KeywordTopics> {
    const prompt = this.buildSingleKeywordPrompt(keyword, maxResults);
    
    const completion = await this.openai.chat.completions.create({
      model: config.openai.model,
      messages: [
        {
          role: 'system',
          content: `You are an elite trending topics analyst with real-time awareness of global digital conversations. Your expertise covers:

- Breaking news and current events across all major outlets
- Social media viral content and trending hashtags
- Tech industry developments and product launches  
- Financial markets and cryptocurrency movements
- Entertainment, sports, and cultural phenomena
- Platform-specific trends (Reddit, TikTok, Twitter/X, YouTube, GitHub)
- Emerging technologies and scientific breakthroughs

You excel at identifying what's HOT right now - not yesterday, not evergreen content, but the topics dominating conversations TODAY. You understand the difference between trending (high current engagement) and popular (high total engagement).

Your summaries are engaging, specific, and explain both WHAT is trending and WHY it matters in the current moment. You capture the zeitgeist and help people understand why everyone is talking about something right now.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: config.openai.temperature,
      max_tokens: maxResults * 150, // Simpler token calculation for single keyword
      presence_penalty: config.openai.presencePenalty,
      frequency_penalty: config.openai.frequencyPenalty
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from OpenAI API');
    }

    // For single keyword, parse directly as topics array
    const topics = this.parseSingleKeywordResponse(content, keyword);
    console.log(`✅ Individual processing succeeded for keyword: ${keyword}`);
    return { keyword, topics };
  }


  private buildSingleKeywordPrompt(keyword: string, maxResults: number): string {
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    return `As an expert trending topics analyst, find the HOTTEST and most current trending topics for "${keyword}" as of ${currentDate}. Provide exactly ${maxResults} topics.

CRITICAL REQUIREMENTS - PRIORITIZE IN THIS ORDER:
1. **RECENCY FIRST**: Focus on topics from the last 24-72 hours. Fresh news breaks, viral moments, and emerging trends take absolute priority.
2. **HIGH ENGAGEMENT**: Topics generating significant buzz, discussions, controversies, or viral spread across platforms.
3. **DIVERSE SOURCE COVERAGE**: Include trending content from:
   - Breaking news outlets (CNN, BBC, Reuters, AP, etc.)
   - Social media platforms (Twitter/X trends, Reddit hot topics, TikTok viral content)
   - Tech platforms (GitHub trending, Product Hunt launches, HackerNews)
   - Forums and communities (Reddit r/all, industry-specific communities)
   - Financial markets (if relevant - stock movements, crypto trends)
   - Entertainment/Sports (viral moments, announcements, controversies)

Return as a simple JSON array of topics:
[
  {
    "title": "Specific, Compelling Topic Title",
    "summary": "HOOK: Why this is trending right now. CONTEXT: What happened and why it matters. IMPACT: What's next or why people care. Keep it 2-3 sentences, punchy and informative."
  }
]

RETURN ONLY THE JSON ARRAY - NO ADDITIONAL TEXT WHATSOEVER.`;
  }

  private buildBatchPrompt(keywords: string[], maxResults: number): string {
    const keywordsList = keywords.map((k, i) => `${i + 1}. ${k}`).join('\n');
    const currentDate = new Date().toISOString().split('T')[0];
    
    return `Find HOTTEST trending topics for these keywords as of ${currentDate}. Provide exactly ${maxResults} topics for each keyword:

${keywordsList}

CRITICAL REQUIREMENTS:
1. **RECENCY**: Focus on last 24-72 hours - breaking news, viral moments, emerging trends
2. **HIGH ENGAGEMENT**: Topics with significant buzz across platforms (news, social media, forums)
3. **DIVERSE SOURCES**: News outlets, Twitter/X, Reddit, TikTok, tech platforms, financial markets

RETURN this EXACT JSON format:
[
  {
    "keyword": "keyword1",
    "topics": [
      {
        "title": "Specific Topic Title",
        "summary": "Why trending now + what happened + impact. 2-3 sentences."
      }
    ]
  }
]

REQUIREMENTS:
- Each keyword MUST have its own object with "keyword" and "topics" fields
- Each topic MUST have "title" and "summary" fields
- Topics must be actively trending NOW, not evergreen content
- Summaries must explain WHY trending and significance

RETURN ONLY THE JSON ARRAY - NO OTHER TEXT.`;
  }

  private parseSingleKeywordResponse(content: string, keyword: string): TrendingTopic[] {
    try {
      // Try to find JSON array in the response
      let jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('No JSON array found in single keyword response');
        return this.getFallbackTopics(keyword);
      }

      let jsonString = jsonMatch[0];
      
      // Clean up common JSON formatting issues
      jsonString = jsonString.replace(/,\s*\]/g, ']');
      jsonString = jsonString.replace(/,\s*\}/g, '}');
      jsonString = jsonString.replace(/[\r\n\t]/g, ' ');
      jsonString = jsonString.replace(/\s+/g, ' ');
      
      const parsed = JSON.parse(jsonString);
      
      if (!Array.isArray(parsed)) {
        console.error('Single keyword response is not an array');
        return this.getFallbackTopics(keyword);
      }
      
      return parsed.map((topic: any) => ({
        title: topic.title || 'Unknown Topic',
        summary: topic.summary || 'No summary available',
        searchUrl: `https://www.google.com/search?q=${encodeURIComponent(keyword + ' ' + (topic.title || 'trending'))}`
      }));
      
    } catch (error) {
      console.error('Error parsing single keyword response:', error);
      return this.getFallbackTopics(keyword);
    }
  }

  private parseBatchResponse(content: string, _keywords: string[]): KeywordTopics[] {
    try {
      // Try to find JSON array in the response
      let jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in batch response');
      }

      let jsonString = jsonMatch[0];
      
      // Clean up common JSON formatting issues
      jsonString = jsonString.replace(/,\s*\]/g, ']');
      jsonString = jsonString.replace(/,\s*\}/g, '}'); 
      jsonString = jsonString.replace(/[\r\n\t]/g, ' ');
      jsonString = jsonString.replace(/\s+/g, ' ');
      
      const parsed = JSON.parse(jsonString);
      
      if (!Array.isArray(parsed)) {
        throw new Error('Batch response is not an array');
      }
      
      // Validate and transform the batch response
      return parsed.map((item: any) => {
        if (!item.keyword || !item.topics || !Array.isArray(item.topics)) {
          throw new Error(`Invalid batch item structure: ${JSON.stringify(item)}`);
        }
        
        return {
          keyword: item.keyword,
          topics: item.topics.map((topic: any) => ({
            title: topic.title || 'Unknown Topic',
            summary: topic.summary || 'No summary available',
            searchUrl: `https://www.google.com/search?q=${encodeURIComponent(item.keyword + ' ' + (topic.title || 'trending'))}`
          }))
        };
      });
      
    } catch (error) {
      console.error('Error parsing batch response:', error);
      throw error; // Re-throw to trigger fallback to individual processing
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