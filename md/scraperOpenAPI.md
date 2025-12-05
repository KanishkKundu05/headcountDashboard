{
  "openapi": "3.0.1",
  "info": {
    "title": "LinkedIn Company Employees Scraper ✅ No Cookies 📧",
    "description": "Extract all LinkedIn Company employees with filters and detailed profile information, including complete work experience, and more. No cookies or account required. This actor can try to find contact emails.",
    "version": "0.0",
    "x-build-id": "Qb3Clfn9nEXfLVQMn"
  },
  "servers": [
    {
      "url": "https://api.apify.com/v2"
    }
  ],
  "paths": {
    "/acts/harvestapi~linkedin-company-employees/run-sync-get-dataset-items": {
      "post": {
        "operationId": "run-sync-get-dataset-items-harvestapi-linkedin-company-employees",
        "x-openai-isConsequential": false,
        "summary": "Executes an Actor, waits for its completion, and returns Actor's dataset items in response.",
        "tags": [
          "Run Actor"
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/inputSchema"
              }
            }
          }
        },
        "parameters": [
          {
            "name": "token",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Enter your Apify token here"
          }
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    },
    "/acts/harvestapi~linkedin-company-employees/runs": {
      "post": {
        "operationId": "runs-sync-harvestapi-linkedin-company-employees",
        "x-openai-isConsequential": false,
        "summary": "Executes an Actor and returns information about the initiated run in response.",
        "tags": [
          "Run Actor"
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/inputSchema"
              }
            }
          }
        },
        "parameters": [
          {
            "name": "token",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Enter your Apify token here"
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/runsResponseSchema"
                }
              }
            }
          }
        }
      }
    },
    "/acts/harvestapi~linkedin-company-employees/run-sync": {
      "post": {
        "operationId": "run-sync-harvestapi-linkedin-company-employees",
        "x-openai-isConsequential": false,
        "summary": "Executes an Actor, waits for completion, and returns the OUTPUT from Key-value store in response.",
        "tags": [
          "Run Actor"
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/inputSchema"
              }
            }
          }
        },
        "parameters": [
          {
            "name": "token",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Enter your Apify token here"
          }
        ],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "inputSchema": {
        "type": "object",
        "properties": {
          "profileScraperMode": {
            "title": "Profile Scraper Mode",
            "enum": [
              "Short ($4 per 1k)",
              "Full ($8 per 1k)",
              "Full + email search ($12 per 1k)"
            ],
            "type": "string",
            "description": "Choose the mode for scraping LinkedIn profiles. The Short mode provides basic information, while the Full mode includes full detailed profile data.",
            "default": "Full ($8 per 1k)"
          },
          "maxItems": {
            "title": "Maximum number of profiles to scrape",
            "type": "integer",
            "description": "Maximum number of profiles to scrape. The actor will stop scraping when this limit is reached."
          },
          "companies": {
            "title": "Companies",
            "maxItems": 1000,
            "type": "array",
            "description": "Search employees of these companies. Provide full LinkedIn URLs. Example: `https://www.linkedin.com/company/google`",
            "items": {
              "type": "string"
            }
          },
          "locations": {
            "title": "Locations Filter",
            "maxItems": 20,
            "type": "array",
            "description": "Filter employees by these LinkedIn locations. Example: `San Francisco`. LinkedIn does not always understand your text queries. For example for \"UK\" query it will apply \"Ukraine\" location, so you should use \"United Kingdom\" in this case. Try this out first in the location filter input of LinkedIn search at `https://www.linkedin.com/search/results/people/?geoUrn=%5B%22103644278%22%5D` - we will use the first suggestion from the autocomplete popup when you type your location",
            "items": {
              "type": "string"
            }
          },
          "searchQuery": {
            "title": "Search employees (fuzzy search)",
            "maxLength": 300,
            "type": "string",
            "description": "Query to search LinkedIn profiles."
          },
          "jobTitles": {
            "title": "Job Title Filter",
            "maxItems": 20,
            "type": "array",
            "description": "Filter Profiles by these LinkedIn job titles. Example: `Software Engineer`.",
            "items": {
              "type": "string"
            }
          },
          "pastJobTitles": {
            "title": "Past Job Title Filter",
            "maxItems": 20,
            "type": "array",
            "description": "Filter Profiles by these LinkedIn past job titles. Example: `Software Engineer`.",
            "items": {
              "type": "string"
            }
          },
          "industryIds": {
            "title": "Industry IDs Filter",
            "maxItems": 20,
            "type": "array",
            "description": "Filter Profiles by these LinkedIn industry IDs. Example: `4` for 'Software Development'. Full list: `https://github.com/HarvestAPI/linkedin-industry-codes-v2/blob/main/linkedin_industry_code_v2_all_eng_with_header.csv`",
            "items": {
              "type": "string"
            }
          },
          "yearsAtCurrentCompanyIds": {
            "title": "Years at Current Company Filter",
            "uniqueItems": true,
            "type": "array",
            "description": "Filter Profiles by these LinkedIn years at current company IDs. Example: `3` for '3 to 5 years'.",
            "items": {
              "type": "string",
              "enum": [
                "1",
                "2",
                "3",
                "4",
                "5"
              ],
              "enumTitles": [
                "Less than 1 year",
                "1 to 2 years",
                "3 to 5 years",
                "6 to 10 years",
                "More than 10 years"
              ]
            }
          },
          "yearsOfExperienceIds": {
            "title": "Years of Experience Filter",
            "type": "array",
            "description": "Filter Profiles by these LinkedIn years of experience IDs. Example: `3` for '3 to 5 years'.",
            "items": {
              "type": "string",
              "enum": [
                "1",
                "2",
                "3",
                "4",
                "5"
              ],
              "enumTitles": [
                "Less than 1 year",
                "1 to 2 years",
                "3 to 5 years",
                "6 to 10 years",
                "More than 10 years"
              ]
            }
          },
          "seniorityLevelIds": {
            "title": "Seniority Level Filter",
            "type": "array",
            "description": "Filter Profiles by these LinkedIn seniority level IDs. Example: `120` for 'Senior'.",
            "items": {
              "type": "string",
              "enum": [
                "100",
                "110",
                "120",
                "130",
                "200",
                "210",
                "220",
                "300",
                "310",
                "320"
              ],
              "enumTitles": [
                "In Training",
                "Entry Level",
                "Senior",
                "Strategic",
                "Entry Level Manager",
                "Experienced Manager",
                "Director",
                "Vice President",
                "CXO",
                "Owner / Partner"
              ]
            }
          },
          "functionIds": {
            "title": "Function Filter",
            "type": "array",
            "description": "Filter Profiles by these LinkedIn function IDs. Example: `8` for 'Engineering'.",
            "items": {
              "type": "string",
              "enum": [
                "1",
                "2",
                "3",
                "4",
                "5",
                "6",
                "7",
                "8",
                "9",
                "10",
                "11",
                "12",
                "13",
                "14",
                "15",
                "16",
                "17",
                "18",
                "19",
                "20",
                "21",
                "22",
                "23",
                "24",
                "25",
                "26"
              ],
              "enumTitles": [
                "Accounting",
                "Administrative",
                "Arts and Design",
                "Business Development",
                "Community and Social Services",
                "Consulting",
                "Education",
                "Engineering",
                "Entrepreneurship",
                "Finance",
                "Healthcare Services",
                "Human Resources",
                "Information Technology",
                "Legal",
                "Marketing",
                "Media and Communication",
                "Military and Protective Services",
                "Operations",
                "Product Management",
                "Program and Project Management",
                "Purchasing",
                "Quality Assurance",
                "Real Estate",
                "Research",
                "Sales",
                "Customer Success and Support"
              ]
            }
          },
          "recentlyChangedJobs": {
            "title": "Recently Changed Jobs Filter",
            "type": "boolean",
            "description": "If enabled, only Profiles of people who have recently changed jobs will be returned."
          },
          "companyBatchMode": {
            "title": "Company Batch Mode",
            "enum": [
              "all_at_once",
              "one_by_one"
            ],
            "type": "string",
            "description": "Choose how to process the companies. 'All at once' will search employees from all companies in one query, while 'One by one' will process each make a query for each company separately. The start fee will apply for each query.",
            "default": "all_at_once"
          },
          "maxItemsPerCompany": {
            "title": "Maximum number of profiles to scrape per company (only for 'one by one' Company Batch Mode)",
            "type": "integer",
            "description": "Maximum number of profiles to scrape. The actor will stop scraping when this limit is reached."
          },
          "startPage": {
            "title": "Start Page",
            "minimum": 0,
            "maximum": 100,
            "type": "integer",
            "description": "The page number to start scraping from. Starts from 1."
          },
          "takePages": {
            "title": "Scrape Search Pages",
            "minimum": 0,
            "maximum": 100,
            "type": "integer",
            "description": "The number of search pages to scrape. Each page contains 25 profiles."
          },
          "excludeLocations": {
            "title": "Exclude Locations Filter",
            "maxItems": 20,
            "type": "array",
            "description": "Exclude Profiles by these LinkedIn locations. Example: `San Francisco`. LinkedIn does not always understand your text queries. For example for \"UK\" query it will apply \"Ukraine\" location, so you should use \"United Kingdom\" in this case. Try this out first in the location filter input of LinkedIn search at `https://www.linkedin.com/search/results/people/?geoUrn=%5B%22103644278%22%5D` - we will use the first suggestion from the autocomplete popup when you type your location",
            "items": {
              "type": "string"
            }
          },
          "excludePastCompanies": {
            "title": "Exclude Past Company Filter",
            "maxItems": 10,
            "type": "array",
            "description": "Exclude Profiles by these LinkedIn past companies. Provide full LinkedIn URLs",
            "items": {
              "type": "string"
            }
          },
          "excludeSchools": {
            "title": "Exclude School Filter",
            "maxItems": 10,
            "type": "array",
            "description": "Exclude Profiles by these LinkedIn schools. Example: `Stanford University`.",
            "items": {
              "type": "string"
            }
          },
          "excludeCurrentJobTitles": {
            "title": "Exclude Current Job Title Filter",
            "maxItems": 20,
            "type": "array",
            "description": "Exclude Profiles by these LinkedIn current job titles. Example: `Software Engineer`.",
            "items": {
              "type": "string"
            }
          },
          "excludePastJobTitles": {
            "title": "Exclude Past Job Title Filter",
            "maxItems": 20,
            "type": "array",
            "description": "Exclude Profiles by these LinkedIn past job titles. Example: `Software Engineer`.",
            "items": {
              "type": "string"
            }
          },
          "excludeIndustryIds": {
            "title": "Exclude Industry IDs Filter",
            "maxItems": 20,
            "type": "array",
            "description": "Exclude Profiles by these LinkedIn industry IDs. Example: `4` for 'Software Development'. Full list: `https://github.com/HarvestAPI/linkedin-industry-codes-v2/blob/main/linkedin_industry_code_v2_all_eng_with_header.csv`",
            "items": {
              "type": "string"
            }
          },
          "excludeSeniorityLevelIds": {
            "title": "Exclude Seniority Level Filter",
            "type": "array",
            "description": "Filter Profiles by these LinkedIn seniority level IDs. Example: `120` for 'Senior'.",
            "items": {
              "type": "string",
              "enum": [
                "100",
                "110",
                "120",
                "130",
                "200",
                "210",
                "220",
                "300",
                "310",
                "320"
              ],
              "enumTitles": [
                "In Training",
                "Entry Level",
                "Senior",
                "Strategic",
                "Entry Level Manager",
                "Experienced Manager",
                "Director",
                "Vice President",
                "CXO",
                "Owner / Partner"
              ]
            }
          },
          "excludeFunctionIds": {
            "title": "Exclude Function Filter",
            "type": "array",
            "description": "Filter Profiles by these LinkedIn function IDs. Example: `8` for 'Engineering'.",
            "items": {
              "type": "string",
              "enum": [
                "1",
                "2",
                "3",
                "4",
                "5",
                "6",
                "7",
                "8",
                "9",
                "10",
                "11",
                "12",
                "13",
                "14",
                "15",
                "16",
                "17",
                "18",
                "19",
                "20",
                "21",
                "22",
                "23",
                "24",
                "25",
                "26"
              ],
              "enumTitles": [
                "Accounting",
                "Administrative",
                "Arts and Design",
                "Business Development",
                "Community and Social Services",
                "Consulting",
                "Education",
                "Engineering",
                "Entrepreneurship",
                "Finance",
                "Healthcare Services",
                "Human Resources",
                "Information Technology",
                "Legal",
                "Marketing",
                "Media and Communication",
                "Military and Protective Services",
                "Operations",
                "Product Management",
                "Program and Project Management",
                "Purchasing",
                "Quality Assurance",
                "Real Estate",
                "Research",
                "Sales",
                "Customer Success and Support"
              ]
            }
          }
        }
      },
      "runsResponseSchema": {
        "type": "object",
        "properties": {
          "data": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string"
              },
              "actId": {
                "type": "string"
              },
              "userId": {
                "type": "string"
              },
              "startedAt": {
                "type": "string",
                "format": "date-time",
                "example": "2025-01-08T00:00:00.000Z"
              },
              "finishedAt": {
                "type": "string",
                "format": "date-time",
                "example": "2025-01-08T00:00:00.000Z"
              },
              "status": {
                "type": "string",
                "example": "READY"
              },
              "meta": {
                "type": "object",
                "properties": {
                  "origin": {
                    "type": "string",
                    "example": "API"
                  },
                  "userAgent": {
                    "type": "string"
                  }
                }
              },
              "stats": {
                "type": "object",
                "properties": {
                  "inputBodyLen": {
                    "type": "integer",
                    "example": 2000
                  },
                  "rebootCount": {
                    "type": "integer",
                    "example": 0
                  },
                  "restartCount": {
                    "type": "integer",
                    "example": 0
                  },
                  "resurrectCount": {
                    "type": "integer",
                    "example": 0
                  },
                  "computeUnits": {
                    "type": "integer",
                    "example": 0
                  }
                }
              },
              "options": {
                "type": "object",
                "properties": {
                  "build": {
                    "type": "string",
                    "example": "latest"
                  },
                  "timeoutSecs": {
                    "type": "integer",
                    "example": 300
                  },
                  "memoryMbytes": {
                    "type": "integer",
                    "example": 1024
                  },
                  "diskMbytes": {
                    "type": "integer",
                    "example": 2048
                  }
                }
              },
              "buildId": {
                "type": "string"
              },
              "defaultKeyValueStoreId": {
                "type": "string"
              },
              "defaultDatasetId": {
                "type": "string"
              },
              "defaultRequestQueueId": {
                "type": "string"
              },
              "buildNumber": {
                "type": "string",
                "example": "1.0.0"
              },
              "containerUrl": {
                "type": "string"
              },
              "usage": {
                "type": "object",
                "properties": {
                  "ACTOR_COMPUTE_UNITS": {
                    "type": "integer",
                    "example": 0
                  },
                  "DATASET_READS": {
                    "type": "integer",
                    "example": 0
                  },
                  "DATASET_WRITES": {
                    "type": "integer",
                    "example": 0
                  },
                  "KEY_VALUE_STORE_READS": {
                    "type": "integer",
                    "example": 0
                  },
                  "KEY_VALUE_STORE_WRITES": {
                    "type": "integer",
                    "example": 1
                  },
                  "KEY_VALUE_STORE_LISTS": {
                    "type": "integer",
                    "example": 0
                  },
                  "REQUEST_QUEUE_READS": {
                    "type": "integer",
                    "example": 0
                  },
                  "REQUEST_QUEUE_WRITES": {
                    "type": "integer",
                    "example": 0
                  },
                  "DATA_TRANSFER_INTERNAL_GBYTES": {
                    "type": "integer",
                    "example": 0
                  },
                  "DATA_TRANSFER_EXTERNAL_GBYTES": {
                    "type": "integer",
                    "example": 0
                  },
                  "PROXY_RESIDENTIAL_TRANSFER_GBYTES": {
                    "type": "integer",
                    "example": 0
                  },
                  "PROXY_SERPS": {
                    "type": "integer",
                    "example": 0
                  }
                }
              },
              "usageTotalUsd": {
                "type": "number",
                "example": 0.00005
              },
              "usageUsd": {
                "type": "object",
                "properties": {
                  "ACTOR_COMPUTE_UNITS": {
                    "type": "integer",
                    "example": 0
                  },
                  "DATASET_READS": {
                    "type": "integer",
                    "example": 0
                  },
                  "DATASET_WRITES": {
                    "type": "integer",
                    "example": 0
                  },
                  "KEY_VALUE_STORE_READS": {
                    "type": "integer",
                    "example": 0
                  },
                  "KEY_VALUE_STORE_WRITES": {
                    "type": "number",
                    "example": 0.00005
                  },
                  "KEY_VALUE_STORE_LISTS": {
                    "type": "integer",
                    "example": 0
                  },
                  "REQUEST_QUEUE_READS": {
                    "type": "integer",
                    "example": 0
                  },
                  "REQUEST_QUEUE_WRITES": {
                    "type": "integer",
                    "example": 0
                  },
                  "DATA_TRANSFER_INTERNAL_GBYTES": {
                    "type": "integer",
                    "example": 0
                  },
                  "DATA_TRANSFER_EXTERNAL_GBYTES": {
                    "type": "integer",
                    "example": 0
                  },
                  "PROXY_RESIDENTIAL_TRANSFER_GBYTES": {
                    "type": "integer",
                    "example": 0
                  },
                  "PROXY_SERPS": {
                    "type": "integer",
                    "example": 0
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}