from schemas.types import EvalRequest, EvalResponse
from tools.llm_router import get_llm, TaskType
import os
import json
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser

class SemanticEvaluator:
    async def evaluate(self, request: EvalRequest) -> EvalResponse:
        groq_api_key = os.environ.get("GROQ_API_KEY")
        
        # Base dummy evaluation if no LLM key
        if not groq_api_key:
            return EvalResponse(
                passed=True,
                overall_score=75.0,
                technical_accuracy=7.0,
                communication=8.0,
                adaptability=7.0,
                efficiency=8.0,
                overall_feedback="Good conceptual understanding shown in the final answer. (Dummy)",
                strengths=["Clear explanations"],
                improvements=["Provide more specific examples"]
            )

        try:
            llm = ChatGroq(model="llama3-8b-8192", api_key=groq_api_key)
            parser = JsonOutputParser()
            
            rubric_text = ", ".join([f"{d.name} ({d.weight})" for d in request.rubric.dimensions])
            
            prompt = PromptTemplate(
                template="""
                You are an expert grader. Evaluate the following essay against the rubric: {rubric}.
                The student's essay: {essay}
                
                Respond in valid JSON with the following keys:
                - passed (boolean)
                - overall_score (float 0-100)
                - technical_accuracy (float 0-10)
                - communication (float 0-10)
                - adaptability (float 0-10)
                - efficiency (float 0-10)
                - overall_feedback (string)
                - strengths (list of strings)
                - improvements (list of strings)
                """,
                input_variables=["rubric", "essay"],
            )
            
            chain = prompt | llm | parser
            result = await chain.ainvoke({"rubric": rubric_text, "essay": request.final_code})
            
            return EvalResponse(**result)
            
        except Exception as e:
            return EvalResponse(
                passed=False,
                overall_score=0.0,
                overall_feedback=f"Error evaluating essay semantically: {str(e)}"
            )
