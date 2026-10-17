"""Pre-defined, parameterized Cypher queries for FalkorDB."""

# Upsert nodes
UPSERT_FILE = """
MERGE (f:File {id: $id})
ON CREATE SET f.repo_id = $repo_id, f.path = $path, f.language = $language, f.content_hash = $content_hash
ON MATCH SET f.content_hash = $content_hash
"""

UPSERT_SYMBOL = """
MERGE (s:Symbol {id: $id})
ON CREATE SET s.repo_id = $repo_id, s.name = $name, s.qualified_name = $qualified_name,
              s.kind = $kind, s.file_path = $file_path, s.start_line = $start_line, s.end_line = $end_line
ON MATCH SET s.start_line = $start_line, s.end_line = $end_line
"""

UPSERT_TEST_CASE = """
MERGE (t:TestCase {id: $id})
ON CREATE SET t.repo_id = $repo_id, t.node_id = $node_id, t.name = $name,
              t.file_path = $file_path, t.framework = $framework
"""

# Upsert relationships
LINK_FILE_DEFINES_SYMBOL = """
MATCH (f:File {id: $file_id})
MATCH (s:Symbol {id: $symbol_id})
MERGE (f)-[:DEFINES]->(s)
"""

LINK_SYMBOL_CALLS_SYMBOL = """
MATCH (caller:Symbol {id: $caller_id})
MATCH (callee:Symbol {id: $callee_id})
MERGE (caller)-[r:CALLS {source_kind: $source_kind, line: $line}]->(callee)
"""

LINK_TEST_COVERS_SYMBOL = """
MATCH (t:TestCase {id: $test_id})
MATCH (s:Symbol {id: $symbol_id})
MERGE (t)-[r:COVERS {source_kind: $source_kind}]->(s)
"""

# Query downstream callers of changed symbols (incoming paths in CALLS direction)
QUERY_CALLERS_OF_CHANGED = """
MATCH p = (caller:Symbol)-[:CALLS*1..5]->(changed:Symbol)
WHERE changed.id IN $symbol_ids
RETURN caller.id AS caller_id,
       caller.name AS caller_name,
       caller.qualified_name AS caller_qualified_name,
       caller.file_path AS file_path,
       caller.start_line AS start_line,
       caller.end_line AS end_line,
       caller.kind AS kind,
       length(p) AS hops,
       [n IN nodes(p) | n.qualified_name] AS path_names,
       changed.id AS changed_symbol_id
ORDER BY hops ASC
LIMIT $limit
"""

# Query tests covering any of the impacted symbols
QUERY_CANDIDATE_TESTS = """
MATCH (t:TestCase)-[c:COVERS]->(s:Symbol)
WHERE s.id IN $impacted_symbol_ids
RETURN t.id AS test_id,
       t.node_id AS node_id,
       t.name AS test_name,
       t.file_path AS file_path,
       count(DISTINCT s) AS covered_impacted_symbols,
       collect(DISTINCT s.id) AS evidence_symbols
ORDER BY covered_impacted_symbols DESC
LIMIT $limit
"""

# Counts
QUERY_NODE_COUNTS = """
MATCH (n)
RETURN labels(n)[0] AS label, count(n) AS count
"""

QUERY_EDGE_COUNTS = """
MATCH ()-[r]->()
RETURN type(r) AS rel_type, count(r) AS count
"""

# Test results and history
RECORD_TEST_RUN = """
CREATE (tr:TestRun {
    id: $id,
    repo_id: $repo_id,
    commit_sha: $commit_sha,
    started_at: $started_at,
    duration_seconds: $duration_seconds
})
"""

RECORD_TEST_RESULT = """
MATCH (tr:TestRun {id: $run_id})
MATCH (t:TestCase {id: $test_id})
CREATE (res:TestResult {
    id: $id,
    status: $status,
    duration_seconds: $duration_seconds,
    error_message: $error_message
})
CREATE (tr)-[:HAS_RESULT]->(res)
CREATE (res)-[:RESULT_FOR]->(t)
"""
