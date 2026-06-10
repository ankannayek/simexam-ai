from schemas.types import EvalRequest, EvalResponse
import os

class EvalState:
    def __init__(self, request: EvalRequest):
        self.request = request
        self.technical_accuracy = 0.0
        self.adaptability = 0.0
        self.efficiency = 0.0
        self.independence = 0.0
        self.communication = 6.0 # Default
        self.doubt_resolution = 6.0 # Default
        self.overall_feedback = ""
        self.strengths = []
        self.improvements = []

    def to_response(self) -> EvalResponse:
        dimension_scores = {
            "technical_accuracy": self.technical_accuracy,
            "adaptability": self.adaptability,
            "efficiency": self.efficiency,
            "independence": self.independence,
            "communication": self.communication,
            "doubt_resolution": self.doubt_resolution
        }
        
        # Calculate weighted overall score
        total_weight = 0
        score_sum = 0
        for dim in self.request.rubric.dimensions:
            weight = dim.weight
            score = dimension_scores.get(dim.name, 0)
            score_sum += score * weight
            total_weight += weight
            
        overall_score = (score_sum / total_weight) if total_weight > 0 else 0
        passed = overall_score >= self.request.rubric.passing_score
        
        # Override to not pass if 0 tests passed
        if getattr(self.request, 'tests_passed', 0) == 0 and getattr(self.request, 'tests_total', 1) > 0:
            passed = False
            
        return EvalResponse(
            tests_passed=getattr(self.request, 'tests_passed', 0),
            tests_total=getattr(self.request, 'tests_total', 0),
            dimension_scores=dimension_scores,
            technical_accuracy=self.technical_accuracy,
            adaptability=self.adaptability,
            communication=self.communication,
            efficiency=self.efficiency,
            doubt_resolution=self.doubt_resolution,
            overall_feedback=self.overall_feedback or "Evaluation completed.",
            strengths=self.strengths or ["Completed the assessment."],
            improvements=self.improvements or ["Keep practicing."],
            passed=passed,
            overall_score=overall_score
        )

async def layer1_deterministic(state: EvalState) -> EvalState:
    # Use test case results
    tests_passed = getattr(state.request, 'tests_passed', 0)
    tests_total = getattr(state.request, 'tests_total', 1)
    
    if tests_total > 0:
        if tests_passed == tests_total:
            state.technical_accuracy = 10.0
        else:
            state.technical_accuracy = (tests_passed / tests_total) * 8.0
            
    return state

async def layer2_rubric(state: EvalState) -> EvalState:
    r = state.request
    
    # Adaptability
    if r.curveball_fired and r.curveball_addressed:
        state.adaptability = 9.0
    elif r.curveball_fired and not r.curveball_addressed:
        state.adaptability = 3.0
    else:
        state.adaptability = 5.0
        
    # Efficiency
    if r.time_elapsed <= 360:
        state.efficiency = 8.0
    elif r.time_elapsed <= 480:
        state.efficiency = 6.0
    else:
        state.efficiency = 4.0
        
    # Independence
    state.independence = max(1.0, 10.0 - min(r.hints_given * 0.5, 3.0))
    
    return state

async def layer3_qualitative(state: EvalState) -> EvalState:
    # Optional LLM qualitative grading (dummy implementation if no key)
    if not os.environ.get("ANTHROPIC_API_KEY") and not os.environ.get("GEMINI_API_KEY"):
        return state
        
    # Here we would call Claude/Gemini to get communication and doubt_resolution scores
    # and to generate overall_feedback, strengths, and improvements
    state.overall_feedback = "Good effort overall. You showed a clear understanding of the basics."
    state.strengths = ["Syntax accuracy", "Speed of implementation"]
    state.improvements = ["Error handling", "Edge cases"]
    
    return state

def compose_final(state: EvalState) -> EvalState:
    if getattr(state.request, 'tests_passed', 0) == 0:
        state.technical_accuracy = min(state.technical_accuracy, 4.0)
    return state

async def evaluate(request: EvalRequest) -> EvalResponse:
    state = EvalState(request)
    state = await layer1_deterministic(state)
    state = await layer2_rubric(state)
    state = await layer3_qualitative(state)
    state = compose_final(state)
    return state.to_response()
