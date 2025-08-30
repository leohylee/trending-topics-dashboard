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

  async getTrendingTopics(keywords: string[], maxResults: number = 5): Promise<KeywordTopics[]> {
    try {
      const prompt = this.buildPrompt(keywords, maxResults);
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a trending topics analyst. Provide current, relevant trending topics with concise summaries.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenAI API');
      }

      return this.parseResponse(content, keywords);
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error('Failed to fetch trending topics from OpenAI');
    }
  }

  private buildPrompt(keywords: string[], maxResults: number): string {
    const keywordsList = keywords.map((k, i) => `${i + 1}. ${k}`).join('\n');
    
    return `Find current trending topics for these keywords and provide exactly ${maxResults} topics for each keyword:

${keywordsList}

For each keyword, provide trending topics in this exact JSON format:
{
  "keyword": "keyword_name",
  "topics": [
    {
      "title": "Topic Title",
      "summary": "A concise 2-3 sentence summary of why this is trending and what it's about."
    }
  ]
}

Requirements:
- Return a JSON array containing one object per keyword
- Each topic should be genuinely trending or newsworthy
- Summaries should be informative and engaging
- Focus on recent developments, news, or popular discussions
- Avoid generic or evergreen content

Return only the JSON array, no additional text.`;
  }

  private parseResponse(content: string, keywords: string[]): KeywordTopics[] {
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return parsed.map((item: any) => ({
        keyword: item.keyword,
        topics: item.topics.map((topic: any) => ({
          title: topic.title,
          summary: topic.summary,
          searchUrl: `https://www.google.com/search?q=${encodeURIComponent(item.keyword + ' ' + topic.title)}`
        }))
      }));
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      return keywords.map(keyword => ({
        keyword,
        topics: this.getFallbackTopics(keyword)
      }));
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