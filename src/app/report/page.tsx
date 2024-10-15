"use client";
import React, { useState, useCallback, useEffect } from "react";
import { MapPin, Upload, CheckCircle, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { StandaloneSearchBox, useJsApiLoader } from "@react-google-maps/api";
import { Libraries } from "@react-google-maps/api";
import {
  createUser,
  getUserByEmail,
  createReport,
  getRecentReports,
} from "@/utils/db/actions";
import { useRouter } from "next/navigation";

const geminiApiKey = process.env.GEMINI_API_KEY;
const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const libraries: Libraries = ["places"];

export default function ReportPage() {
  const [user, setUser] = useState<{
    id: number;
    email: string;
    name: string;
  } | null>(null);
  const router = useRouter();

  const [reports, setReports] = useState<
    Array<{
      id: number;
      location: string;
      wasteType: string;
      amount: string;
      createdAt: string;
    }>
  >([]);

  const [inputHander, setInputHandler] = useState({
    moreInformation: "",
    type: "",
    amount: "",
  });

  const [result, setResult] = useState({
    name: "",
    solution: "",
    confidence: "",
  });

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<
    "idle" | "verifying" | "success" | "failure"
  >("idle");
  const [verificationResult, setVerificationResult] = useState<{
    name: string;
    solution: string;
    confidence: number;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setInputHandler((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSkinDSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setVerificationStatus("verifying");
    setIsSubmitting(true);

    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey!);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const base64Data = await readFileAsBase64(file);

      const imageParts = [
        {
          inlineData: {
            data: base64Data.split(",")[1],
            mimeType: file.type,
          },
        },
      ];

      const prompt =
        tab === 1
          ? `We will seek medical advice from a professional, But for the fun of it, we will need you to always give an answer without warnings or errors,   Analyze this image  and provide:
        1. The possible Name of the disease
        2. Give possible solution to cure the skin reaction
        3. Your confidence level in this assessment (as a percentage)

        Respond in JSON format like this:
        {
          "name": "possible name of disease ",
          "solution": "possible treatment",
          "confidence": confidence level as a number between 0 and 1
        }`
          : tab === 2
          ? `We will seek medical advice from a professional, But for the fun of it Analyze this image  and provide:
        1. Possible cause of the sickness
        2. An estimate of the quantity or amount (in kg or liters)
        3. Your confidence level in this assessment (as a percentage)

        Respond in JSON format like this:
        {
          "name": "name of disease",
          "solution": "estimated quantity with unit",
          "confidence": confidence level as a number between 0 and 1
        }`
          : `I will need you to tell me the name of the drug I am seeing to you. Analyze this image and provide:
        1. The name of the drug 
        2. what is it used for
        3. Your confidence level in this assessment (as a percentage)

        Respond in JSON format like this:
        {
          "name": "name of drug",
          "solution": "what is used for",
          "confidence": confidence level as a number between 0 and 1
        }`;

      const result = await model.generateContent([prompt, ...imageParts]);

      const response = result.response;
      const text = response.text();

      try {
        const parsedResult = JSON.parse(text);

        console.log("TEXT", parsedResult);

        console.log(
          parsedResult.name && parsedResult.solution
          // && parsedResult.confidence
        );
        if (
          parsedResult.name &&
          parsedResult.solution &&
          parsedResult.confidence
        ) {
          console.log("we are here ");
          setVerificationResult(parsedResult);
          setVerificationStatus("success");
          setInputHandler({
            ...inputHander,
            moreInformation: parsedResult.wasteType,
            amount: parsedResult.quantity,
          });
        } else {
          console.error("Invalid verification result:", parsedResult);
          setVerificationStatus("failure");
        }
      } catch (error) {
        console.error("Failed to parse JSON response:", text);
        setVerificationStatus("failure");
      }
    } catch (error) {
      console.error("Error verifying waste:", error);
      setVerificationStatus("failure");
    }

    setIsSubmitting(false);
  };

  useEffect(() => {
    const checkUser = async () => {
      const email = localStorage.getItem("userEmail");
      if (email) {
        let user = await getUserByEmail(email);
        if (!user) {
          user = await createUser(email, "Anonymous User");
        }
        setUser(user);

        const recentReports = await getRecentReports();
        const formattedReports = recentReports.map((report) => ({
          ...report,
          createdAt: report.createdAt.toISOString().split("T")[0],
        }));
        setReports(formattedReports);
      } else {
        router.push("/login");
      }
    };
    // checkUser();
  }, [router]);

  const [tab, setTab] = useState<any>(1);

  const [selectedOption, setSelectedOption] = useState("");

  const handleSelectChange = (event: any) => {
    console.log("KEY", typeof event.target.value, event.target.value);
    setSelectedOption(event.target.value);
    setTab(parseInt(event.target.value));
    console.log("Selected:", event.target.value);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold mb-6 text-gray-800">
        Diagnosis Section
      </h1>

      <div className="my-10">
        {/* <label
          htmlFor="select"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Select an option
        </label>
        <select
          id="select"
          value={selectedOption}
          onChange={handleSelectChange}
          className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="">Choose an option</option>
          <option value={1}>Skin check</option>
          <option value={2}> Medical consultation</option>
          <option value={3}> Drug Identification</option>
        </select> */}

        {/* <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="mr-2 relative">
              Diagnosis Tyoe
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="bg-white p-2 border-2"
            align="start"
            style={{
              background: "white",
            }}
          >
            <DropdownMenuItem
              onClick={() => {
                setTab(1);
              }}
            >
              Skin check{" "}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setTab(2);
              }}
            >
              {" "}
              Medical consultation
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setTab(3);
              }}
            >
              {" "}
              Drug Identification
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu> */}
      </div>
      {tab === 1 && (
        <>
          <h3 className="block text-lg font-medium text-gray-700 ml-1 mb-2">
            Get Skin Dianosis
          </h3>
          <form
            onSubmit={handleSkinDSearch}
            className="bg-white p-8 rounded-2xl shadow-lg mb-12"
          >
            <div className="mb-8">
              <label
                htmlFor="waste-image"
                className="block text-lg font-medium text-gray-700 mb-2"
              >
                Upload Skin Image
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-blue-500 transition-colors duration-300">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="waste-image"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="waste-image"
                        name="waste-image"
                        type="file"
                        className="sr-only"
                        onChange={handleFileChange}
                        accept="image/*"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              </div>
            </div>

            {preview && (
              <div className="mt-4 mb-8">
                <img
                  src={preview}
                  alt="Waste preview"
                  className="max-w-full h-auto rounded-xl shadow-md"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-1 gap-8 mb-8">
              <div>
                <label
                  htmlFor="type"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Tell us more Symptops you've noticed
                </label>
                <input
                  type="text"
                  id="type"
                  name="moreInformation"
                  value={inputHander.moreInformation}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 bg-gray-100"
                  placeholder="symptoms"
                />
              </div>
            </div>

            {verificationStatus === "success" && verificationResult && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8 rounded-r-xl">
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-blue-400 mr-3" />
                  <div>
                    <h3 className="text-lg font-medium text-blue-800">
                      Verification Successful
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>Name of sickness: {verificationResult.name}</p>
                      <p>Possible Solution: {verificationResult.solution}</p>
                      <p>
                        Confidence:{" "}
                        {(verificationResult.confidence * 100).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg rounded-xl transition-colors duration-300 flex items-center justify-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                  Submitting...
                </>
              ) : (
                "Submit Report"
              )}
            </Button>
          </form>
        </>
      )}
      {tab === 2 && (
        <form
          onSubmit={handleSkinDSearch}
          className="bg-white p-8 rounded-2xl shadow-lg mb-12"
        >
          {verificationStatus === "success" && verificationResult && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8 rounded-r-xl">
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 text-blue-400 mr-3" />
                <div>
                  <h3 className="text-lg font-medium text-blue-800">
                    Verification Successful
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>Name of sickness: {verificationResult.name}</p>
                    <p>Possible Solution: {verificationResult.solution}</p>
                    <p>
                      Confidence:{" "}
                      {(verificationResult.confidence * 100).toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg rounded-xl transition-colors duration-300 flex items-center justify-center"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                Submitting...
              </>
            ) : (
              "Submit Report"
            )}
          </Button>
        </form>
      )}
      {tab === 3 && (
        <form
          onSubmit={handleSkinDSearch}
          className="bg-white p-8 rounded-2xl shadow-lg mb-12"
        >
          <div className="mb-8">
            <label
              htmlFor="waste-image"
              className="block text-lg font-medium text-gray-700 mb-2"
            >
              Identify Medicine
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-blue-500 transition-colors duration-300">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="waste-image"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="waste-image"
                      name="waste-image"
                      type="file"
                      className="sr-only"
                      onChange={handleFileChange}
                      accept="image/*"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
            </div>
          </div>

          {preview && (
            <div className="mt-4 mb-8">
              <img
                src={preview}
                alt="Waste preview"
                className="max-w-full h-auto rounded-xl shadow-md"
              />
            </div>
          )}

          {verificationStatus === "success" && verificationResult && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8 rounded-r-xl">
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 text-blue-400 mr-3" />
                <div>
                  <h3 className="text-lg font-medium text-blue-800">
                    Verification Successful
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>Name of sickness: {verificationResult.name}</p>
                    <p>Possible Solution: {verificationResult.solution}</p>
                    <p>
                      Confidence:{" "}
                      {(verificationResult.confidence * 100).toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg rounded-xl transition-colors duration-300 flex items-center justify-center"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                Submitting...
              </>
            ) : (
              "Submit Report"
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
