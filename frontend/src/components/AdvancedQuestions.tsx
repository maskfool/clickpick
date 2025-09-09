import { useState } from "react";
import { CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Question {
  id: string;
  question: string;
  yesPrompt: string;
  noPrompt: string;
}

interface AdvancedQuestionsProps {
  onPromptGenerated: (prompt: string) => void;
}

const questions: Question[] = [
  {
    id: "style",
    question: "Do you want a vibrant, eye-catching style?",
    yesPrompt: "vibrant colors, high contrast, eye-catching design",
    noPrompt: "minimal, clean, subtle colors"
  },
  {
    id: "text",
    question: "Should the thumbnail include bold text overlay?",
    yesPrompt: "bold text overlay, readable typography",
    noPrompt: "no text overlay, image-focused design"
  },
  {
    id: "emotion",
    question: "Do you want to convey excitement or energy?",
    yesPrompt: "energetic, exciting, dynamic composition",
    noPrompt: "calm, professional, sophisticated mood"
  },
  {
    id: "people",
    question: "Should it feature people or characters?",
    yesPrompt: "featuring people, human faces, characters",
    noPrompt: "abstract design, objects, no people"
  },
  {
    id: "arrows",
    question: "Do you want attention-grabbing elements (arrows, circles)?",
    yesPrompt: "with arrows, circles, highlighting elements",
    noPrompt: "clean design without highlighting elements"
  }
];

export const AdvancedQuestions = ({ onPromptGenerated }: AdvancedQuestionsProps) => {
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [currentStep, setCurrentStep] = useState(0);

  const handleAnswer = (questionId: string, answer: boolean) => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      generatePrompt(newAnswers);
    }
  };

  const generatePrompt = (finalAnswers: Record<string, boolean>) => {
    const promptParts = questions.map(q => 
      finalAnswers[q.id] ? q.yesPrompt : q.noPrompt
    );
    
    const finalPrompt = `Create a YouTube thumbnail with ${promptParts.join(', ')}, professional quality, 16:9 aspect ratio, high resolution`;
    onPromptGenerated(finalPrompt);
  };

  const resetQuestions = () => {
    setAnswers({});
    setCurrentStep(0);
  };

  if (currentStep >= questions.length) {
    return (
      <Card className="bg-card/80 backdrop-blur-xl border-border/50">
        <CardContent className="text-center py-8">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Prompt Generated!</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Your custom AI prompt has been created based on your answers.
          </p>
          <Button onClick={resetQuestions} variant="outline" size="sm">
            Start Over
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <Card className="bg-card/80 backdrop-blur-xl border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Question {currentStep + 1} of {questions.length}
          </CardTitle>
          <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-gradient-primary h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <h3 className="text-base font-medium text-center">{currentQuestion.question}</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => handleAnswer(currentQuestion.id, true)}
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary/20 hover:border-primary"
          >
            <CheckCircle className="w-6 h-6 text-green-400" />
            <span>Yes</span>
          </Button>
          
          <Button
            onClick={() => handleAnswer(currentQuestion.id, false)}
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-destructive/20 hover:border-destructive"
          >
            <XCircle className="w-6 h-6 text-red-400" />
            <span>No</span>
          </Button>
        </div>

        {Object.keys(answers).length > 0 && (
          <div className="text-center">
            <Button onClick={resetQuestions} variant="ghost" size="sm">
              Reset Answers
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
