use actix_web::{web, App, HttpServer, HttpResponse};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
struct PercentileRequest {
    samples: Vec<EndpointSamples>,
}

#[derive(Debug, Deserialize)]
struct EndpointSamples {
    endpoint: String,
    values: Vec<u32>,
}

#[derive(Debug, Serialize)]
struct PercentileResult {
    endpoint: String,
    p50: u32,
    p95: u32,
    p99: u32,
    count: usize,
}

#[derive(Debug, Serialize)]
struct PercentileResponse {
    results: Vec<PercentileResult>,
}

/// Compute a percentile from a pre-sorted slice using index arithmetic.
/// Values must be sorted ascending before calling this function.
fn percentile(sorted: &[u32], pct: f64) -> u32 {
    if sorted.is_empty() {
        return 0;
    }
    let idx = ((pct / 100.0) * (sorted.len() - 1) as f64).round() as usize;
    sorted[idx.min(sorted.len() - 1)]
}

async fn compute_percentiles(body: web::Json<PercentileRequest>) -> HttpResponse {
    let results: Vec<PercentileResult> = body
        .samples
        .iter()
        .map(|s| {
            // Sort values (they come pre-sorted from SQL ORDER BY, but sort defensively)
            let mut sorted = s.values.clone();
            sorted.sort_unstable();

            PercentileResult {
                endpoint: s.endpoint.clone(),
                p50: percentile(&sorted, 50.0),
                p95: percentile(&sorted, 95.0),
                p99: percentile(&sorted, 99.0),
                count: sorted.len(),
            }
        })
        .collect();

    HttpResponse::Ok().json(PercentileResponse { results })
}

async fn health() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({ "status": "ok" }))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let port: u16 = std::env::var("PORT")
        .unwrap_or_else(|_| "3010".to_string())
        .parse()
        .unwrap_or(3010);

    println!("🦀 Rust aggregator listening on port {port}");

    HttpServer::new(|| {
        App::new()
            .route("/health", web::get().to(health))
            .route("/percentiles", web::post().to(compute_percentiles))
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}
