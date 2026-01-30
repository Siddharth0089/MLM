import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { STARTERCODE } from "../data/problems";
import Navbar from "../components/Navbar";
import axios from "axios";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import ProblemDescription from "../components/ProblemDescription";
import OutputPanel from "../components/OutputPanel";
import CodeEditorPanel from "../components/CodeEditorPanel";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";

function ProblemPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [currentProblemId, setCurrentProblemId] = useState(
    id || "6971d786c717f8b5a863b1124"
  );

  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    return localStorage.getItem("selectedLanguage") || "javascript";
  });

  const [code, setCode] = useState("");
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentProblem, setCurrentProblem] = useState(null);

  const getStorageKey = (problemId, lang) => `code_${problemId}_${lang}`;

  // ✅ Load cached code OR starter code
  useEffect(() => {
    const key = getStorageKey(currentProblemId, selectedLanguage);
    const savedCode = localStorage.getItem(key);

    if (savedCode) setCode(savedCode);
    else setCode(STARTERCODE[selectedLanguage]);

    setOutput(null);
  }, [currentProblemId, selectedLanguage]);

  // ✅ Save code into cache
  useEffect(() => {
    if (!code) return;
    const key = getStorageKey(currentProblemId, selectedLanguage);
    localStorage.setItem(key, code);
  }, [code, currentProblemId, selectedLanguage]);

  // ✅ Fetch problem from backend when id changes
  useEffect(() => {
    if (!id) return;

    setCurrentProblemId(id);

    const fetchProblem = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/problem/${id}`);

        // adjust this based on backend
        const fetchedProblem = res.data.problem?.problem || res.data.problem;

        console.log("Fetched problem:", fetchedProblem);

        if (fetchedProblem) setCurrentProblem(fetchedProblem);
      } catch (err) {
        console.log("Error fetching problem:", err.message);
      }
    };

    fetchProblem();
  }, [id]);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setSelectedLanguage(newLang);
    localStorage.setItem("selectedLanguage", newLang);
    setOutput(null);
  };

  const handleProblemChange = (newProblemId) => navigate(`/problem/${newProblemId}`);

  const triggerConfetti = () => {
    confetti({ particleCount: 80, spread: 250, origin: { x: 0.2, y: 0.6 } });
    confetti({ particleCount: 80, spread: 250, origin: { x: 0.8, y: 0.6 } });
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput(null);

    try {
      const result = await axios.post("http://localhost:5000/api/submit", {
        code,
        language: selectedLanguage,
        problemId: id,
      });

      setOutput(result.data);

      if (result.data.success) {
        triggerConfetti();
        toast.success("All tests passed! Great job!");
      } else {
        toast.error("Tests failed!");
      }
    } catch (err) {
      toast.error("Code execution failed!");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="h-screen bg-base-100 flex flex-col">
      <Navbar />

      <div className="flex-1">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={40} minSize={30}>
            <ProblemDescription
              problem={currentProblem}
              currentProblemId={currentProblemId}
              onProblemChange={handleProblemChange}
            />
          </Panel>

          <PanelResizeHandle className="w-2 bg-base-300 hover:bg-primary transition-colors cursor-col-resize" />

          <Panel defaultSize={60} minSize={30}>
            <PanelGroup direction="vertical">
              <Panel defaultSize={15} minSize={15}>
                <CodeEditorPanel
                  selectedLanguage={selectedLanguage}
                  code={code}
                  isRunning={isRunning}
                  onLanguageChange={handleLanguageChange}
                  onCodeChange={setCode}
                  onRunCode={handleRunCode}
                />
              </Panel>

              <PanelResizeHandle className="h-2 bg-base-300 hover:bg-primary transition-colors cursor-row-resize" />

              <Panel defaultSize={30} minSize={30}>
                <OutputPanel output={output} />
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

export default ProblemPage;
