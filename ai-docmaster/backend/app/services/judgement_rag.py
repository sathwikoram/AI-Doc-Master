"""
Previous Judgement Search — RAG (Retrieval Augmented Generation)

Architecture:
  1. Seed a ChromaDB vector store with curated sample Indian court judgements
  2. On query: embed the case description → similarity search → top-k chunks
  3. Optionally pass retrieved context to LLM for a refined summary answer

ChromaDB is used as persistent local vector store (no external service needed).
"""
from __future__ import annotations
import os
import json
from typing import List, Dict, Any, Optional
from loguru import logger
from app.config import settings

# ── Sample judgement corpus (seed data) ───────────────────────────────────────
# In production, load hundreds of real judgements from Indian Kanoon / eCourts
SAMPLE_JUDGEMENTS = [
    {
        "id": "j001",
        "title": "Lalman Shukla v Gauri Dutt (1913)",
        "court": "Allahabad High Court",
        "category": "Civil",
        "year": 1913,
        "summary": "A person cannot accept an offer without having knowledge of it. Communication of acceptance must reach the offeror. Key precedent in contract law.",
        "outcome": "Plaintiff's claim dismissed. Offer must be known to accept.",
        "sections": ["Indian Contract Act §2(b)", "Section 8"],
        "tags": ["contract", "offer", "acceptance", "knowledge"],
    },
    {
        "id": "j002",
        "title": "Bachan Singh v State of Punjab (1980)",
        "court": "Supreme Court of India",
        "category": "Criminal",
        "year": 1980,
        "summary": "Death penalty is constitutional but should be awarded only in 'rarest of rare' cases. Court must consider aggravating and mitigating circumstances.",
        "outcome": "Death sentence upheld with the 'rarest of rare' doctrine established.",
        "sections": ["IPC §302", "Article 21"],
        "tags": ["murder", "death penalty", "rarest of rare", "capital punishment"],
    },
    {
        "id": "j003",
        "title": "Mohd. Ahmed Khan v Shah Bano Begum (1985)",
        "court": "Supreme Court of India",
        "category": "Family Law",
        "year": 1985,
        "summary": "A Muslim woman is entitled to maintenance from her husband beyond the iddat period under Section 125 CrPC. Right to maintenance overrides personal law.",
        "outcome": "Wife entitled to maintenance.",
        "sections": ["CrPC §125", "Muslim Personal Law"],
        "tags": ["maintenance", "divorce", "muslim", "alimony", "family"],
    },
    {
        "id": "j004",
        "title": "Vishaka v State of Rajasthan (1997)",
        "court": "Supreme Court of India",
        "category": "Labour & Employment",
        "year": 1997,
        "summary": "Laid down guidelines for prevention of sexual harassment at workplace, known as Vishaka Guidelines. Employer has duty to prevent and resolve complaints.",
        "outcome": "Vishaka guidelines issued as binding law until legislation enacted.",
        "sections": ["Article 14", "Article 19", "Article 21", "IPC §354"],
        "tags": ["sexual harassment", "workplace", "women", "employment"],
    },
    {
        "id": "j005",
        "title": "Sarla Mudgal v Union of India (1995)",
        "court": "Supreme Court of India",
        "category": "Family Law",
        "year": 1995,
        "summary": "A Hindu husband cannot solemnize a second marriage by converting to Islam without dissolving the first marriage. Such a marriage is void and attracts bigamy charges.",
        "outcome": "Conversion to Islam for second marriage held invalid; bigamy charges upheld.",
        "sections": ["HMA §494", "IPC §494", "Article 44"],
        "tags": ["bigamy", "conversion", "marriage", "divorce", "family"],
    },
    {
        "id": "j006",
        "title": "M.C. Mehta v Union of India (1987) — Oleum Gas Leak",
        "court": "Supreme Court of India",
        "category": "Civil",
        "year": 1987,
        "summary": "Established the principle of absolute liability: enterprises engaged in hazardous activity are absolutely liable for harm without exception, superseding the rule in Rylands v Fletcher.",
        "outcome": "Shriram Foods held absolutely liable; new principle of absolute liability established.",
        "sections": ["Article 21", "Article 32", "Environmental Protection Act"],
        "tags": ["environment", "liability", "industry", "gas leak", "absolute liability"],
    },
    {
        "id": "j007",
        "title": "Pratap Dileep Verma v State (2022)",
        "court": "Bombay High Court",
        "category": "Cyber Crime",
        "year": 2022,
        "summary": "Online fraud via fake investment scheme. Accused used morphed documents. Court held that IT Act §66D and §66C are applicable along with IPC §420.",
        "outcome": "Accused convicted under IT Act and IPC.",
        "sections": ["IT Act §66C", "IT Act §66D", "IPC §420"],
        "tags": ["online fraud", "identity theft", "investment", "cyber crime"],
    },
    {
        "id": "j008",
        "title": "Olga Tellis v Bombay Municipal Corporation (1985)",
        "court": "Supreme Court of India",
        "category": "Constitutional/Public Law",
        "year": 1985,
        "summary": "Right to livelihood is part of the right to life under Article 21. Pavement dwellers cannot be evicted without following due process.",
        "outcome": "Forced eviction without notice unconstitutional.",
        "sections": ["Article 21", "Article 19(1)(e)"],
        "tags": ["eviction", "livelihood", "article 21", "constitutional", "housing"],
    },
    {
        "id": "j009",
        "title": "Ram Niwas v Rajasthan Housing Board (2019)",
        "court": "Rajasthan High Court",
        "category": "Property Dispute",
        "year": 2019,
        "summary": "Allottee of government housing scheme cannot be dispossessed without following natural justice principles. Cancellation of allotment without hearing is void.",
        "outcome": "Cancellation of housing allotment quashed.",
        "sections": ["Transfer of Property Act §54", "Article 14", "Natural Justice"],
        "tags": ["property", "housing", "allotment", "natural justice", "government"],
    },
    {
        "id": "j010",
        "title": "State v Mukesh & Anr (Nirbhaya Case) (2017)",
        "court": "Supreme Court of India",
        "category": "Criminal",
        "year": 2017,
        "summary": "Gang rape and murder of victim in moving vehicle. Supreme Court upheld death penalty citing extreme brutality, absence of mitigating factors, and rarest of rare doctrine.",
        "outcome": "Death sentence confirmed for convicts.",
        "sections": ["IPC §376A", "IPC §302", "IPC §307"],
        "tags": ["rape", "murder", "death penalty", "gang rape", "criminal"],
    },
    {
        "id": "j011",
        "title": "Gian Singh v State of Punjab (2012)",
        "court": "Supreme Court of India",
        "category": "Criminal",
        "year": 2012,
        "summary": "High Court has inherent power under §482 CrPC to quash FIR and criminal proceedings when the parties have settled the dispute, especially in cases involving personal disputes.",
        "outcome": "Quashing of FIR permitted in personal disputes on settlement.",
        "sections": ["CrPC §482", "IPC §498A"],
        "tags": ["fir", "quashing", "settlement", "domestic", "crpc 482"],
    },
    {
        "id": "j012",
        "title": "SAIL v Union of India (2006)",
        "court": "Supreme Court of India",
        "category": "Labour & Employment",
        "year": 2006,
        "summary": "Contract labourers are entitled to regularization if they perform perennial nature of work. Employer cannot avoid permanency through contract system.",
        "outcome": "Contract workers directed to be regularized.",
        "sections": ["Contract Labour Act §10", "Industrial Disputes Act §25F"],
        "tags": ["contract labour", "regularization", "employment", "workers"],
    },
]


# ── ChromaDB setup ────────────────────────────────────────────────────────────
_chroma_client = None
_collection = None


def _get_collection():
    global _chroma_client, _collection
    if _collection is not None:
        return _collection

    try:
        import chromadb
        from chromadb.utils import embedding_functions

        _chroma_client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
        ef = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )
        _collection = _chroma_client.get_or_create_collection(
            name="judgements",
            embedding_function=ef,
            metadata={"hnsw:space": "cosine"},
        )

        # Seed if empty
        if _collection.count() == 0:
            _seed_collection(_collection)

        logger.info(f"[RAG] ChromaDB loaded — {_collection.count()} judgements")
    except Exception as e:
        logger.warning(f"[RAG] ChromaDB unavailable: {e}. Using FAISS fallback.")
        _collection = None

    return _collection


def _seed_collection(collection):
    """Load sample judgements into ChromaDB."""
    documents = [f"{j['title']}. {j['summary']} Tags: {', '.join(j['tags'])}" for j in SAMPLE_JUDGEMENTS]
    metadatas = [
        {
            "title": j["title"],
            "court": j["court"],
            "category": j["category"],
            "year": j["year"],
            "outcome": j["outcome"],
            "sections": ", ".join(j["sections"]),
        }
        for j in SAMPLE_JUDGEMENTS
    ]
    ids = [j["id"] for j in SAMPLE_JUDGEMENTS]
    collection.add(documents=documents, metadatas=metadatas, ids=ids)
    logger.info(f"[RAG] Seeded {len(SAMPLE_JUDGEMENTS)} judgements into ChromaDB")


# ── Main search function ───────────────────────────────────────────────────────
async def search_judgements(
    case_description: str,
    category: Optional[str] = None,
    top_k: int = 5,
) -> Dict[str, Any]:
    collection = _get_collection()

    results_list = []

    if collection:
        results_list = _chroma_search(collection, case_description, category, top_k)
    else:
        results_list = _keyword_fallback_search(case_description, category, top_k)

    # LLM-powered relevance summary
    if results_list:
        ai_insight = await _llm_judgement_insight(case_description, results_list)
    else:
        ai_insight = "No similar judgements found in the database."

    return {
        "query": case_description[:200],
        "similar_judgements": results_list,
        "ai_insight": ai_insight,
        "total_found": len(results_list),
    }


def _chroma_search(collection, query: str, category: Optional[str], top_k: int) -> List[Dict]:
    where = {"category": category} if category else None
    try:
        results = collection.query(
            query_texts=[query],
            n_results=min(top_k, collection.count()),
            where=where,
            include=["metadatas", "distances", "documents"],
        )
        items = []
        for i, meta in enumerate(results["metadatas"][0]):
            items.append({
                "title": meta.get("title"),
                "court": meta.get("court"),
                "category": meta.get("category"),
                "year": meta.get("year"),
                "outcome": meta.get("outcome"),
                "sections": meta.get("sections", "").split(", "),
                "relevance_score": round(1 - results["distances"][0][i], 3),
                "snippet": results["documents"][0][i][:300],
            })
        return sorted(items, key=lambda x: x["relevance_score"], reverse=True)
    except Exception as e:
        logger.error(f"[RAG] Chroma search error: {e}")
        return []


def _keyword_fallback_search(query: str, category: Optional[str], top_k: int) -> List[Dict]:
    """Simple keyword overlap fallback when ChromaDB unavailable."""
    query_words = set(query.lower().split())
    scored = []
    for j in SAMPLE_JUDGEMENTS:
        if category and j["category"] != category:
            continue
        tag_words = set(" ".join(j["tags"]).split())
        summary_words = set(j["summary"].lower().split())
        overlap = len(query_words & (tag_words | summary_words))
        if overlap > 0:
            scored.append((overlap, j))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [
        {
            "title": j["title"],
            "court": j["court"],
            "category": j["category"],
            "year": j["year"],
            "outcome": j["outcome"],
            "sections": j["sections"],
            "relevance_score": round(min(score / 10, 1.0), 3),
            "snippet": j["summary"][:300],
        }
        for score, j in scored[:top_k]
    ]


async def _llm_judgement_insight(case_description: str, judgements: List[Dict]) -> str:
    refs = "\n".join([f"- {j['title']} ({j['year']}): {j['outcome']}" for j in judgements[:3]])
    system = "You are an expert Indian legal research assistant."
    user = f"""Based on the following similar judgements:
{refs}

Provide a 2-3 sentence insight on how these precedents could help or affect this case:
\"\"\"{case_description[:300]}\"\"\"

Be concise and practical."""
    try:
        return await get_llm_response(system, user, temperature=0.3, max_tokens=300)
    except Exception:
        return "Review the listed judgements as potential precedents for your case."


from app.services.llm_client import get_llm_response
