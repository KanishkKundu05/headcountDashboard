c;# Run Actor synchronously with input and get dataset items


```
POST 
https://api.apify.com/v2/acts/:actorId/run-sync-get-dataset-items
```


Runs a specific Actor and returns its dataset items.

The POST payload including its `Content-Type` header is passed as `INPUT` to the Actor (usually `application/json`). The HTTP response contains the Actors dataset items, while the format of items depends on specifying dataset items' `format` parameter.

You can send all the same options in parameters as the  API endpoint.

The Actor is started with the default options; you can override them using URL query parameters. If the Actor run exceeds 300 seconds, the HTTP response will return the 408 status code (Request Timeout).

Beware that it might be impossible to maintain an idle HTTP connection for a long period of time, due to client timeout or network conditions. Make sure your HTTP client is configured to have a long enough connection timeout. If the connection breaks, you will not receive any information about the run and its status.

To run the Actor asynchronously, use the  API endpoint instead.

## Request

## Responses

* 201
* 400
* 408

**Response Headers**

* **X-Apify-Pagination-Offset**

  **X-Apify-Pagination-Limit**

  **X-Apify-Pagination-Count**

  **X-Apify-Pagination-Total**

**Response Headers**



**Response Headers**

