import { Crawler } from "../service/crawler";
import { createResource } from "../actions/resources";

// Load environment variables
import { config } from "dotenv";
config();

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set in environment variables");
}

export async function seed() {
  try {
    // Initialize the crawler with desired depth and max pages
    const crawler = new Crawler(2, 10); // Crawl up to 10 pages with depth of 2

    // Define starting URLs for crawling
    const startUrls = [
      "https://solana.com/docs",
      "https://solana.com/developers",
      // Add more URLs as needed
    ];

    // Crawl each URL and create resources with embeddings
    for (const url of startUrls) {
      console.log(`Crawling: ${url}`);
      const pages = await crawler.crawl(url);

      // Create resources and embeddings for each page
      for (const page of pages) {
        console.log(`Creating resource for: ${page.url}`);
        const result = await createResource({ content: page.content });
        console.log(result);
      }
    }

    console.log("Seeding completed successfully!");
  } catch (error) {
    console.error("Error during seeding:", error);
    throw error;
  }
}

// Run the seed function if this file is executed directly
const isDirectExecution = process.argv[1] === new URL(import.meta.url).pathname;

if (isDirectExecution) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Failed to seed database:", error);
      process.exit(1);
    });
}
