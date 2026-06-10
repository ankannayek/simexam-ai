import json
from schemas.types import EvalRequest, EvalResponse

class GraphEvaluator:
    async def evaluate(self, request: EvalRequest) -> EvalResponse:
        try:
            # Assuming final_code contains the JSON string from tldraw or similar
            graph = json.loads(request.final_code)
            # A simple heuristic check for key system design nodes/edges
            # In a real scenario, this would inspect node types, labels, and connections.
            records = graph if isinstance(graph, list) else []
            nodes = [r for r in records if r.get("typeName") == "shape"]
            
            tests_passed = 1 if len(nodes) > 0 else 0
            tests_total = 1
            overall_score = 100.0 if tests_passed else 0.0
            passed = tests_passed == tests_total
            
            return EvalResponse(
                tests_passed=tests_passed,
                tests_total=tests_total,
                overall_score=overall_score,
                passed=passed,
                technical_accuracy=overall_score / 10,
                communication=8.0,
                adaptability=8.0,
                efficiency=8.0,
                overall_feedback="Graph parsed successfully and contains system design nodes." if passed else "No valid system design nodes found.",
                strengths=["Basic node structures present"] if passed else [],
                improvements=["Add more specific node connections"] if passed else ["Add nodes to the canvas"]
            )
        except Exception as e:
            return EvalResponse(
                tests_passed=0,
                tests_total=1,
                overall_score=0.0,
                passed=False,
                overall_feedback=f"Failed to parse graph JSON: {str(e)}"
            )
