import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { Upload, FileText, Download, Search, AlertCircle, BookOpen } from 'lucide-react';
import * as pdfjsLib from "pdfjs-dist";

// Create the worker
const worker = new Worker(new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url), {
  type: "module"
});

pdfjsLib.GlobalWorkerOptions.workerPort = worker;

interface Question {
  id: number;
  text: string;
  answer: string;
  sourceFile?: string;
}

interface ReferenceDocument {
  filename: string;
  content: string;
  pages: number;
}

const App: React.FC = () => {
  console.log('🚀 App component loaded/reloaded at:', new Date().toLocaleTimeString());
  
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [referenceDocs, setReferenceDocs] = useState<ReferenceDocument[]>([]);
  const [isLoadingReferences, setIsLoadingReferences] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // List of reference PDF files (you'll need to add these to public/reference-pdfs/)
  const referencePdfFiles = [
    "AA.1000_CEO20250206_v20250201.pdf",
    "AA.1204_20240725_v20240701.pdf",
    "AA.1207a_CEO20240605_v2024060.pdf",
    "AA.1207b_CEO20241113_v20241107.pdf",
    "AA.1207c_CEO20241113_v20241107.pdf",
    "AA.1208_CEO20240808_v20240801.pdf",
    "AA.1214_CEO20241216_v20241201.pdf",
    "AA.1215_20240725_v20240701.pdf",
    "AA.1216_CEO20240725_v20240701.pdf",
    "AA.1217_CEO20240725_v20240701.pdf",
    "AA.1219a_CEO20240912_v20240901.pdf",
    "AA.1219b_v20240301_CEO20240424.pdf",
    "AA.1220_CEO20240620_v20240401.pdf",
    "AA.1223_CEO20241216_v20241201.pdf",
    "AA.1251_CEO20250306_v20250301.pdf",
    "AA.1270_CEO20241119_v20241107.pdf",
    "AA.1271_CEO20250129_v20250101.pdf",
    "AA.1275_CEO20241119_v20241107.pdf",
    "AA.1400_CEO20241205_v20241205.pdf",
    "CMC.3001_CEO20240523.pdf",
    "CMC.9002__Policy_CEO20220818_DHCS20220701_PRC20220518_v.20220501_CEO.pdf",
    "CMC.9003__Policy_CEO20220818_DHCS20220701_PRC20220518_v.20220501_CEO.pdf",
    "CMC.9005__Policy_CEO20220818_DHCS20220701_PRC20220518_v.20220501_CEO.pdf",
    "DD.2001_CEO20240515_no attachments.pdf",
    "DD.2002_CEO20250206_v20241231.pdf",
    "DD.2003_CEO20241216_v20241201.pdf",
    "DD.2004_CEO20241031_v20241001.pdf",
    "DD.2005_CEO20241216_v20241201.pdf",
    "DD.2006_CEO20241216_v20241201.pdf",
    "DD.2006b_CEO20241205_v20241205.pdf",
    "DD.2008_CEO20241216_v20241201.pdf",
    "DD.2012_CEO20241216_v20241201.pdf",
    "DD.2013_CEO20241031_v20241001.pdf",
    "DD.2014_CEO20250206_v20250101.pdf",
    "EE.1101_CEO20241205_v20241205.pdf",
    "EE.1103_CEO20250129_v20250101.pdf",
    "EE.1106_v20240401_CEO20240417_no attachments.pdf",
    "EE.1111_CEO20240523.pdf",
    "EE.1112_CEO20240523.pdf",
    "EE.1116_CEO20241122_v20241101.pdf",
    "EE.1119_v20240301_CEO20240307_no attachments.pdf",
    "EE.1124_CEO20241031_v20241001.pdf",
    "EE.1135_CEO20241220_v20241201.pdf",
    "EE.1141_20250221.pdf",
    "EE.1144_CEO20250227_v20250201.pdf",
    "EE.1145_CEO20250306_v20250306_final version.pdf",
    "FF.1001_CEO20240523.pdf",
    "FF.1002_CEO20240620_v20240601.pdf",
    "FF.1003_20250221.pdf",
    "FF.1004_CEO20241010_v20241001.pdf",
    "FF.1005a_v20240404.pdf",
    "FF.1005c_v20240404.pdf",
    "FF.1006_CEO20240808_v20240801.pdf",
    "FF.1007_CEO20240509.pdf",
    "FF.1009_CEO20240808_v20240801.pdf",
    "FF.1010_CEO20240523.pdf",
    "FF.1014_CEO20250109_v20240901.pdf",
    "FF.2001_20250221.pdf",
    "FF.2003_v20240404.pdf",
    "FF.2004_20240404.pdf",
    "FF.2005_CEO20241122_v20241101.pdf",
    "FF.2007_CEO20240822_v20240801.pdf",
    "FF.2009_CEO20240808_v20240801.pdf",
    "FF.2011_CEO20240808_v20240701.pdf",
    "FF.2012_CEO20240808_v20240701.pdf",
    "FF.3001_CEO20240808_v20240801.pdf",
    "FF.3002_CEO20240808_v20240801.pdf",
    "FF.3003_CEO20241220_v20241201.pdf",
    "FF.4000_CEO20240620_v20240601.pdf",
    "FF.4002_CEO20240808_v20240801.pdf",
    "GA.4010_CEO20241220_v20241201.pdf",
    "GA.7107_CEO20250129_v20241231.pdf",
    "GA.7110_v20240201_CEO20240222_no attachments.pdf",
    "GA.7111_CEO20240725_v2024070.pdf",
    "GA.8048_CEO20250129_v20241231.pdf",
    "GG.1100_CEO20250129_v20241231.pdf",
    "GG.1101_CEO20250227_v20250101.pdf",
    "GG.1102_v20231231_CEO20240129_no attachments.pdf",
    "GG.1103_CEO20241220_v20241201.pdf",
    "GG.1105_CEO20240509.pdf",
    "GG.1107_CEO20241220_v20241201.pdf",
    "GG.1109_CEO20241220_v20241201.pdf",
    "GG.1110_CEO20241031_v20241001.pdf",
    "GG.1111_CEO20241220_v20241201.pdf",
    "GG.1112_CEO20241220_v20241201.pdf",
    "GG.1113_CEO20241220_v20241201.pdf",
    "GG.1114_v20240101_CEO20231214_no attachments.pdf",
    "GG.1116_CEO20241122_v20241101.pdf",
    "GG.1118_CEO20240725_v20240701.pdf",
    "GG.1119_CEO20241220_20241201.pdf",
    "GG.1120_CEO20241220_v20241201.pdf",
    "GG.1121_CEO20240509_no attachments.pdf",
    "GG.1122_CEO20241220_v20241201.pdf",
    "GG.1125_CEO20241220_v20241201.pdf",
    "GG.1128_CEO20241220_v20241201.pdf",
    "GG.1130_CEO20240515.pdf",
    "GG.1132_CEO20240509_QA.pdf",
    "GG.1201_CEO20241113_v20241001.pdf",
    "GG.1204_CEO20250306_v20250301.pdf",
    "GG.1205_CEO20241010_v20241001.pdf",
    "GG.1206_CEO20241031_v20241001.pdf",
    "GG.1211_CEO20241031_v20241001.pdf",
    "GG.1213_CEO20250116_v20250101.pdf",
    "GG.1301_v20230701_CEO20231220_no attachments.pdf",
    "GG.1302a_v20231001_CEO20231102_no attachments.pdf",
    "GG.1304_CEO20250129_v20250101.pdf",
    "GG.1308_v20240101_CEO20231214_no attachments.pdf",
    "GG.1312_CEO20241220_v20241201.pdf",
    "GG.1313_CEO20250129_v20250101.pdf",
    "GG.1317_CEO20241220_v20241201.pdf",
    "GG.1318_v20240101_CEO20231214_no attachments.pdf",
    "GG.1320_v20231201_CEO20231226.pdf",
    "GG.1321_v20240404.pdf",
    "GG.1323_v20230401_CEO20230823_no attachments_.pdf",
    "GG.1324_v20230301_CEO20230823_no attachments.pdf",
    "GG.1325_CEO20250306_v20250301.pdf",
    "GG.1330_CEO20250227_v20250101.pdf",
    "GG.1352_v20231101_CEO20231207_no attachments.pdf",
    "GG.1353_CEO20240905_v20240801.pdf",
    "GG.1354_CEO20240905_v20240801.pdf",
    "GG.1355_CEO20240924_v20240901.pdf",
    "GG.1356_CEO20240905_v20240801.pdf",
    "GG.1357_CEO20240918_v20240901.pdf",
    "GG.1401_CEO20240509_no attachments.pdf",
    "GG.1407_CEO20241216_v20241201.pdf",
    "GG.1409_CEO20241031_v20241001.pdf",
    "GG.1422_CEO20241031_v20241001.pdf",
    "GG.1428_v20240301_CEO20240328_no attachments.pdf",
    "GG.1500_CEO20241122_v20241101.pdf",
    "GG.1501_CEO20240605_v20240601.pdf",
    "GG.1502_CEO20240523.pdf",
    "GG.1503_CEO20240924_v20240901.pdf",
    "GG.1504_v20240410.pdf",
    "GG.1505_CEO20240523.pdf",
    "GG.1506_CEO20241220_v20241201.pdf",
    "GG.1507_CEO20240515.pdf",
    "GG.1508_CEO20241122_v20241101.pdf",
    "GG.1510_20250214.pdf",
    "GG.1513_CEO20241220_20241201.pdf",
    "GG.1515_CEO20240523.pdf",
    "GG.1516_CEO20250129_v20241231.pdf",
    "GG.1517_CEO20240523.pdf",
    "GG.1531_CEO20240605_v20240601.pdf",
    "GG.1532_CEO20250129_v20241231.pdf",
    "GG.1535_CEO20241220_v20241201.pdf",
    "GG.1538_CEO20241220_v20241201.pdf",
    "GG.1539_CEO20240523.pdf",
    "GG.1541_CEO20250129_v20241231.pdf",
    "GG.1546_CEO20241220_20241201.pdf",
    "GG.1547_CEO20250129_v20250101.pdf",
    "GG.1548_v20240201_CEO20240228.pdf",
    "GG.1549_CEO20241216_v20241201.pdf",
    "GG.1550_CEO20240523.pdf",
    "GG.1600_CEO20241220_v20241201.pdf",
    "GG.1602_CEO20241113_v20241001.pdf",
    "GG.1603_CEO20241031_v20241001.pdf",
    "GG.1605_v20231101_CEO20231207.pdf",
    "GG.1607_CEO20241113_v20241001.pdf",
    "GG.1608_CEO20241017_v20241001.pdf",
    "GG.1611_CEO20241010_v20241001.pdf",
    "GG.1613_CEO20241122_v20241101.pdf",
    "GG.1615_CEO20241220_v20241201.pdf",
    "GG.1616__CEO20241220_v20241201.pdf",
    "GG.1617_CEO20241031_v20241001.pdf",
    "GG.1618_CEO20250206_v20250201.pdf",
    "GG.1619_v20231101_CEO20231207_no attachments.pdf",
    "GG.1620_CEO20240605_v20240601.pdf",
    "GG.1621_CEO20241113_v20241001.pdf",
    "GG.1628__CEO20241220_v20241201.pdf",
    "GG.1629_CEO20240822_v20240601.pdf",
    "GG.1630_CEO20241010_v20241001.pdf",
    "GG.1633_CEO20241122_v20241101.pdf",
    "GG.1634_CEO20240822_v20240601.pdf",
    "GG.1637_CEO20240620_v20240601.pdf",
    "GG.1639_CEO20241220_20241201.pdf",
    "GG.1643_CEO20241220_20241201.pdf",
    "GG.1645_CEO20241220_20241201.pdf",
    "GG.1650_CEO20240620_v20240501.pdf",
    "GG.1651_CEO20241017_v20241001.pdf",
    "GG.1652_CEO20241220_v20241201.pdf",
    "GG.1655_CEO20240924_v20240901.pdf",
    "GG.1656_CEO20241010_v20241001.pdf",
    "GG.1657_CEO20241031_v20241001.pdf",
    "GG.1658_CEO20241220_20241201.pdf",
    "GG.1659_CEO20241216_v20241201.pdf",
    "GG.1660_CEO20241220_v20241201.pdf",
    "GG.1661_CEO20240822_v20240701_rev title.pdf",
    "GG.1665_CEO20241010_v20241001.pdf",
    "GG.1666_CEO20240711_v20240701.pdf",
    "GG.1667_CEO20240822_v20240701.pdf",
    "GG.1668_CEO20241220_20241205.pdf",
    "GG.1701_CEO20241025_v20240801.pdf",
    "GG.1704_CEO20241113_v20241001.pdf",
    "GG.1706_v20231201_CEO20231226_no attachments.pdf",
    "GG.1707_v20240201_CEO20240222_no attachments.pdf",
    "GG.1713_CEO20240924_v20240901.pdf",
    "GG.1717_CEO20240626_v20240601.pdf",
    "GG.1800_CEO20240905_v20240901.pdf",
    "GG.1802_CEO20250109_v20241101.pdf",
    "GG.1803_CEO20240905_v20240901.pdf",
    "GG.1804_CEO20240905_v20240901.pdf",
    "GG.1805_CEO20240924_v20240901.pdf",
    "GG.1806_CEO20240924_v20240901.pdf",
    "GG.1808_CEO20240924_v20240901.pdf",
    "GG.1809_CEO20240924_v20240901.pdf",
    "GG.1810_CEO20240924_v20240901.pdf",
    "GG.1811_CEO20250109_v20241101.pdf",
    "GG.1814_CEO20240711_v20240701.pdf",
    "GG.1815_CEO20241031_v20241001.pdf",
    "GG.1816_CEO20250109_v20241101.pdf",
    "GG.1822_CEO20241031_v20241001.pdf",
    "GG.1826_CEO20241031_v20241001.pdf",
    "GG.1828_CEO20241031_v20241001.pdf",
    "GG.1829_CEO20241113_v20241001.pdf",
    "GG.1830_CEO20241113_v20241001.pdf",
    "GG.1831_CEO20241031_v20241001.pdf",
    "GG.1832_CEO20241031_v20241001.pdf",
    "GG.1834_CEO20241031_v20241001.pdf",
    "GG.1900_CEO20250206_v20241231.pdf",
    "HH.1101_v20231207_CEO20231207_no attachments.pdf",
    "HH.1102_CEO20240905_v20240901.pdf",
    "HH.1104_CEO20240912_v20240901.pdf",
    "HH.1105_CEO20241119_v20241107.pdf",
    "HH.1106_v20231201_CEO20231214_no attachments.pdf",
    "HH.1107_CEO20241120_v20241107.pdf",
    "HH.1108_CEO20240912_v20240901.pdf",
    "HH.1109_v20231201_CEO20231226.pdf",
    "HH.2002_CEO20241120_v20241107.pdf",
    "HH.2003_CEO20241031_v20241001.pdf",
    "HH.2005_CEO20241119_v20241107.pdf",
    "HH.2007_CEO20241119_v20241107.pdf",
    "HH.2014_CEO20241119_v20241107.pdf",
    "HH.2015_CEO20240509_no attachments.pdf",
    "HH.2018_CEO20241107_v20241107.pdf",
    "HH.2019_CEO20241120_v20241107.pdf",
    "HH.2020_CEO20241120_v20241107.pdf",
    "HH.2021_CEO20241120_v20241107.pdf",
    "HH.2022_CEO20241119_v20241107.pdf",
    "HH.2023_CEO20241220_v20241201.pdf",
    "HH.2025_v20231101_CEO20231207_no attachments.pdf",
    "HH.2027_v20231101_CEO20231207_no attachments.pdf",
    "HH.2028_CEO20241205_v20241107_2025.pdf",
    "HH.3000_CEO20241119_v20241107.pdf",
    "HH.3001_CEO20241119_v20241001.pdf",
    "HH.3002_CEO20241119_v20241107.pdf",
    "HH.3003_CEO20241119_v20241001.pdf",
    "HH.3004_CEO20241120_v20241107.pdf",
    "HH.3005_CEO20241120_v20241107.pdf",
    "HH.3006_CEO20241120_v20241107.pdf",
    "HH.3007_CEO20241120_v20241107.pdf",
    "HH.3008_CEO20241119_v20241107.pdf",
    "HH.3009_CEO20241120_v20241107.pdf",
    "HH.3010_CEO20241119_v20241107.pdf",
    "HH.3011_CEO20241120_v20241107.pdf",
    "HH.3012_CEO20240725_v20240701.pdf",
    "HH.3014_CEO20241119_v20241107.pdf",
    "HH.3015_CEO20241119_v20241001.pdf",
    "HH.3016_CEO20241119_v20241107.pdf",
    "HH.3019_CEO20241120_v20241107.pdf",
    "HH.3020_CEO20241119_v20241107.pdf",
    "HH.3022_CEO20241113_v20241107.pdf",
    "HH.3023_CEO20241113_v20241001.pdf",
    "HH.3024_CEO20241119_v20241107.pdf",
    "HH.4001_v20231101_CEO20231207_no attachments.pdf",
    "HH.5000_CEO20241119_v20241107.pdf",
    "HH.5004_CEO20241120_v20241107.pdf",
    "MA.1001_v20240101_CEO20240129_no attachments.pdf",
    "MA.1004_CEO20241216_v20241201.pdf",
    "MA.1005_CEO20240509.pdf",
    "MA.2001_CEO20241122_v20241101.pdf",
    "MA.2002_CEO20241122_v20241101.pdf",
    "MA.2012_CEO20241122_v20241101.pdf",
    "MA.2017_CEO20241122_v20241101.pdf",
    "MA.2022_CEO20240822_v20240801.pdf",
    "MA.2030_CEO20241122_v20241101.pdf",
    "MA.2100_CEO20241010_v20241001.pdf",
    "MA.2101_CEO20240808_v20240801.pdf",
    "MA.3001_CEO20240523.pdf",
    "MA.3002_CEO20240808_v20240801.pdf",
    "MA.3003_CEO20240523.pdf",
    "MA.3101_CEO20240509.pdf",
    "MA.3103_20250221.pdf",
    "MA.3105_v20240404.pdf",
    "MA.4001_CEO20241031_v20241001.pdf",
    "MA.4003_CEO20241216_v20250101.pdf",
    "MA.4004_CEO20241216_v20241201.pdf",
    "MA.4005_CEO20241216_v20241201.pdf",
    "MA.4007_CEO20241216_v20241201.pdf",
    "MA.4008_CEO20241216__v20241201.pdf",
    "MA.4009_CEO20241010_v20241001.pdf",
    "MA.4010_CEO20241216_v20241201.pdf",
    "MA.4011_CEO20241216_v20241201.pdf",
    "MA.4015_CEO20241216_v20241201.pdf",
    "MA.4016_CEO20241031_v20241001.pdf",
    "MA.5007_CEO20241031_v20241001.pdf",
    "MA.5012_CEO20241122_v20241101.pdf",
    "MA.5013_CEO20241216_v20241201.pdf",
    "MA.6009_CEO20240822_v20240801.pdf",
    "MA.6021_v20240101_CEO20240129_no attachments.pdf",
    "MA.6021a_CEO20240509_no attachments.pdf",
    "MA.6022_CEO20240711_v20240701.pdf",
    "MA.6023_CEO20241220_20241201.pdf",
    "MA.6024_CEO20241220_20241201.pdf",
    "MA.6026_v20240101_CEO20240129.pdf",
    "MA.6030_v20240101_CEO20240129_no attachments.pdf",
    "MA.6032_CEO20241122_v20241101.pdf",
    "MA.6040_CEO20241122_v20241101.pdf",
    "MA.6042_CEO20241220_20241201.pdf",
    "MA.6044_CEO20241220_20241201.pdf",
    "MA.6101_CEO20241122_v20241101.pdf",
    "MA.6103_CEO20241122_v20241101.pdf",
    "MA.6104_CEO20241031_v20241001.pdf",
    "MA.6105_CEO20241216_v20241201.pdf",
    "MA.6106_CEO20241031_v20250101_2025.pdf",
    "MA.6107_CEO20241216_v20241201.pdf",
    "MA.6108_CEO20241216_v20241201.pdf",
    "MA.6109_CEO20241216_v20241201.pdf",
    "MA.6110_CEO20241216_v20241201.pdf",
    "MA.6112_CEO20241216_v20241201.pdf",
    "MA.6113_CEO20241216_v20241201.pdf",
    "MA.6114_CEO20241122_v20241101.pdf",
    "MA.6115_CEO20250109_v20241231.pdf",
    "MA.7007_CEO20241220_v20241201.pdf",
    "MA.7020_CEO20241220_v20241201.pdf",
    "MA.7025_CEO20241010_v20241001.pdf",
    "MA.9002_CEO20250129_v20241231.pdf",
    "MA.9004_20250221.pdf",
    "MA.9005__Policy_CEO20221221_PRC7a20221212_v.20221201_CEO.pdf",
    "MA.9006_v20231207_CEO20231207_no attachments.pdf",
    "MA.9007_v20231201_CEO20231214_no attachments_revised.pdf",
    "MA.9008_v20231201_CEO20231214_no attachments.pdf",
    "MA.9009_v20231207_CEO20231207_no attachments.pdf",
    "MA.9015_20250221.pdf",
    "MA.9110_CEO20240605_v20240601.pdf",
    "MA.9124_CEO20241120_v20241107.pdf",
    "PA.1000_CEO20240924_v20240901.pdf",
    "PA.1001_CEO20250306_v20250301.pdf",
    "PA.1002_CEO20240620_v20240601.pdf",
    "PA.1003_20250221.pdf",
    "PA.1004_CEO20250306_v20250301.pdf",
    "PA.1005_CEO20250306_v20250301.pdf",
    "PA.2001_CEO20241031_v20250101_2025.pdf",
    "PA.2002_CEO20241031_v20250101_2025.pdf",
    "PA.2003_CEO20250306_v20250101.pdf",
    "PA.2005_v20240301_CEO20240307.pdf",
    "PA.2010_CEO20240509.pdf",
    "PA.2020_v20240201_CEO20240212.pdf",
    "PA.2021_v20240201_CEO20240212.pdf",
    "PA.2022_CEO20241031_v20250101_2025.pdf",
    "PA.3001_CEO20250129_v20250101.pdf",
    "PA.5001_CEO20240509.pdf",
    "PA.5030_CEO20240509_no attachments.pdf",
    "PA.5040_20250221.pdf",
    "PA.5042_v20240301_CEO20240320_no attachments.pdf",
    "PA.5044_CEO20240509.pdf",
    "PA.5050_v20240301_CEO20240320_no attachments.pdf",
    "PA.5051_v20240301_CEO20240307_no attachments.pdf",
    "PA.5052_20250221.pdf",
    "PA.5053_20250221.pdf",
    "PA.5054_20250221.pdf",
    "PA.5110_CEO20240924_v20240901.pdf",
    "PA.5111_CEO20240905_v20240901.pdf",
    "PA.5201_CEO20240822_v20240801.pdf",
    "PA.5202_CEO20240620_v20240601.pdf",
    "PA.5203_20250221.pdf",
    "PA.5204_CEO20240808_v20240801.pdf",
    "PA.6001_20250221.pdf",
    "PA.7001_CEO20241216_v20250101_2025.pdf",
    "PA.7002_CEO20241010_v20241001.pdf",
    "PA.7100_CEO20241205_v20241001.pdf",
    "PA.8001_v20240401_CEO20240417_no attachments.pdf",
    "PA.9001_CEO20240620_v20240601.pdf",
    "PA.9002_CEO20240620_v20240601.pdf"
  ];

  // Load reference PDFs on component mount
  useEffect(() => {
    loadReferencePDFs();
  }, []);

  // Load and process all reference PDFs
  const loadReferencePDFs = async (): Promise<void> => {
    setIsLoadingReferences(true);
    const loadedDocs: ReferenceDocument[] = [];

    for (const filename of referencePdfFiles) {
      try {
        const response = await fetch(`${process.env.PUBLIC_URL}/reference-pdfs/${filename}?v=${Date.now()}`);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();

          // clone the buffer so PDF.js can detach one without breaking the other
          const arrayBufferCopy = arrayBuffer.slice(0);

          // now only give PDF.js the copy
          const pdf = await pdfjsLib.getDocument({ data: arrayBufferCopy }).promise;

          const content = await extractTextFromPDFBuffer(arrayBuffer);
          
          loadedDocs.push({
            filename,
            content,
            pages: pdf.numPages
          });
        }
      } catch (err) {
        console.warn(`Could not load reference PDF: ${filename}`, err);
      }
    }

    setReferenceDocs(loadedDocs);
    setIsLoadingReferences(false);
  };

  // Extract text from PDF using PDF.js
  const extractTextFromPDFBuffer = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    try {
      console.log('Starting PDF text extraction, buffer size:', arrayBuffer.byteLength);
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      console.log('PDF loaded successfully, pages:', pdf.numPages);
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        console.log(`Processing page ${i}/${pdf.numPages}`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
            .filter(str => str.length > 0)
            .join('\n'); 
        fullText += pageText + '\n';
        console.log(`Page ${i} text length:`, pageText.length);
      }
      fullText = fullText
      .replace(/\r\n|\r|\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();   

      console.log('Total extracted text length:', fullText.length);
      return fullText;
    } catch (error) {
      console.error('Error in extractTextFromPDFBuffer:', error);
      throw error;
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('File selected:', file.name, 'Type:', file.type, 'Size:', file.size);

    // More comprehensive PDF validation
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF file');
      return;
    }

    // Check file size (optional - adjust limit as needed)
    const maxSize = 50 * 1024 * 1024; // 50MB limit
    if (file.size > maxSize) {
      setError('File is too large. Please upload a file smaller than 50MB.');
      return;
    }

    if (file.size === 0) {
      setError('The selected file is empty. Please choose a valid PDF file.');
      return;
    }

    setError('');
    setUploadedFile(file);
    setIsProcessing(true);

    try {
      await extractTextFromPDF(file);
    } catch (err) {
      console.error('File upload error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError('Error processing PDF: ' + errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Extract text from uploaded PDF
  const extractTextFromPDF = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      console.log(`File details: Name=${file.name}, Size=${file.size}, Type=${file.type}, LastModified=${file.lastModified}`);
      
      const reader = new FileReader();
      
      reader.onload = async function(e: ProgressEvent<FileReader>) {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          console.log(`FileReader result size: ${arrayBuffer?.byteLength || 'undefined'}`);
          
          if (!arrayBuffer) {
            throw new Error('FileReader failed to read the file');
          }
          
          // Debug: Check first few bytes
          const uint8Array = new Uint8Array(arrayBuffer.slice(0, 20));
          const firstBytes = Array.from(uint8Array).map(b => String.fromCharCode(b)).join('');
          console.log(`First 20 characters from uploaded file: "${firstBytes}"`);
          console.log(`First 20 bytes as hex:`, Array.from(uint8Array).map(b => b.toString(16).padStart(2, '0')).join(' '));
          
          const text = await extractTextFromPDFBuffer(arrayBuffer);
          setExtractedText(text);
          extractQuestions(text);
          resolve(text);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  };

  const extractQuestions = (text: string): void => {
    // Matches questions starting with a number and ending with a (Reference: ... ) pattern
    const questionPattern = /\d+\.\s*([\s\S]*?\(Reference:.*?\))/g;

    const foundQuestions: string[] = [];
    let match;
    
    while ((match = questionPattern.exec(text)) !== null) {
      // match[1] contains the full question text without the number
      const questionText = match[1].trim();
      foundQuestions.push(questionText);
    }

    // Convert to Question objects
    const cleanQuestions: Question[] = foundQuestions.map((q, index) => ({
      id: index + 1,
      text: q,
      answer: '',
      sourceFile: ''
    }));

    setQuestions(cleanQuestions);
  };

  const searchReferencePDFs = async (): Promise<void> => {
    if (referenceDocs.length === 0) {
      setError('No reference documents loaded. Please add PDF files to the public/reference-pdfs folder.');
      return;
    }

    setIsProcessing(true);

    const updatedQuestions: Question[] = questions.map(question => {
      const questionKeywords = extractKeywords(question.text);

      const matchedSnippets: { snippet: string; source: string; score: number }[] = [];

      // Loop through all reference PDFs
      referenceDocs.forEach(doc => {
        const score = calculateMatchScore(questionKeywords, doc.content);
        if (score > 0) {
          let snippet = extractRelevantText(questionKeywords, doc.content);

          // Clean up spacing and line breaks
          snippet = snippet.replace(/\s+/g, ' ').trim();

          matchedSnippets.push({ snippet, source: doc.filename, score });
        }
      });

      if (matchedSnippets.length === 0) {
        return {
          ...question,
          answer: 'No relevant answer found in reference documents.',
          sourceFile: ''
        };
      }

      // Sort by score descending and take top matches
      matchedSnippets.sort((a, b) => b.score - a.score);
      const topMatches = matchedSnippets.slice(0, 3); // Adjust N as desired

      const finalAnswer = topMatches
        .map(m => `${m.snippet} (Source: ${m.source})`)
        .join('\n\n');

      return {
        ...question,
        answer: finalAnswer,
        sourceFile: topMatches.map(m => m.source).join(', ')
      };
    });

    setQuestions(updatedQuestions);
    setIsProcessing(false);
  };

  // Extract keywords from question
  const extractKeywords = (text: string): string[] => {
    // Remove common question words and extract meaningful terms
    const stopWords = new Set(['what', 'how', 'when', 'where', 'why', 'who', 'which', 'is', 'are', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
  };

  // Calculate match score between keywords and document content
  const calculateMatchScore = (keywords: string[], content: string): number => {
    const contentLower = content.toLowerCase();
    let score = 0;
    keywords.forEach(keyword => {
      const matches = (contentLower.match(new RegExp(keyword, 'g')) || []).length;
      score += matches;
    });
    return score;
  };

  // Extract relevant text around keywords
  const extractRelevantText = (keywords: string[], content: string): string => {
    const sentences = content.split(/[.!?]+/);
    let bestSentences: string[] = [];
    let bestScore = 0;

    // Find sentences containing the most keywords
    sentences.forEach((sentence, index) => {
      const sentenceLower = sentence.toLowerCase();
      const score = keywords.reduce((acc, keyword) => {
        return acc + (sentenceLower.includes(keyword) ? 1 : 0);
      }, 0);

      if (score > bestScore && score > 0) {
        bestScore = score;
        // Include current sentence and surrounding context
        const start = Math.max(0, index - 1);
        const end = Math.min(sentences.length, index + 2);
        bestSentences = sentences.slice(start, end);
      }
    });

    return bestSentences.join('. ').trim() || 'No specific match found.';
  };

  // Generate and download results as text file
  const downloadResults = (): void => {
    const content = questions.map(q => 
      `Question ${q.id}: ${q.text}\n\nAnswer:\n${q.answer}\n\nSource: ${q.sourceFile || 'N/A'}\n\n${'='.repeat(50)}\n\n`
    ).join('');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questions-and-answers.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetApp = (): void => {
    setUploadedFile(null);
    setExtractedText('');
    setQuestions([]);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            PDF Question Answering System
          </h1>
          <p className="text-gray-600">
            Upload a PDF with questions, and we'll find answers from our reference documents
          </p>
        </header>

        {/* Reference Documents Status */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <BookOpen className="mr-2" size={20} />
            Reference Documents ({referenceDocs.length})
          </h2>
          
          {isLoadingReferences ? (
            <div className="flex items-center text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
              Loading reference documents...
            </div>
          ) : referenceDocs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {referenceDocs.map((doc, index) => (
                <div key={index} className="p-2 bg-green-50 rounded border border-green-200">
                  <p className="text-sm font-medium text-green-800">{doc.filename}</p>
                  <p className="text-xs text-green-600">{doc.pages} pages loaded</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-orange-600">
              No reference documents loaded. Add PDF files to public/reference-pdfs/ and refresh.
            </p>
          )}
          
          <button 
            onClick={() => {
              console.log('Manual test button clicked');
              loadReferencePDFs();
            }}
            className="mt-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
          >
            Test Load Reference PDFs
          </button>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Upload className="mr-2" size={20} />
            Upload Question PDF
          </h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
              id="pdf-upload"
            />
            <label htmlFor="pdf-upload" className="cursor-pointer">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                {uploadedFile ? uploadedFile.name : 'Click to upload PDF'}
              </p>
              <p className="text-gray-500">
                {uploadedFile ? 'File uploaded successfully' : 'Select a PDF file containing questions'}
              </p>
            </label>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
              <AlertCircle size={20} className="mr-2" />
              {error}
            </div>
          )}
        </div>

        {/* Processing Status */}
        {isProcessing && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-6">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-3"></div>
              Processing PDF...
            </div>
          </div>
        )}

        {/* Extracted Questions */}
        {questions.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FileText className="mr-2" size={20} />
              Extracted Questions ({questions.length})
            </h2>
            
            <div className="space-y-3">
              {questions.map((question) => (
                <div key={question.id} className="p-3 bg-gray-50 rounded border-l-4 border-blue-500">
                  <p className="font-medium text-gray-800">
                    {question.id}. {question.text}
                  </p>
                  {question.answer && (
                    <div className="mt-2 p-2 bg-green-50 rounded">
                      <p className="text-sm text-gray-600 font-medium">Answer:</p>
                      <p className="text-sm text-gray-700 whitespace-pre-line">
                        {question.answer}
                      </p>
                      {question.sourceFile && (
                        <p className="text-xs text-blue-600 mt-1">
                          Source: {question.sourceFile}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={searchReferencePDFs}
                disabled={isProcessing || questions.every(q => q.answer) || referenceDocs.length === 0}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Search className="mr-2" size={16} />
                {questions.every(q => q.answer) ? 'Already Searched' : 'Search Reference PDFs'}
              </button>
              
              {questions.some(q => q.answer) && (
                <button
                  onClick={downloadResults}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center"
                >
                  <Download className="mr-2" size={16} />
                  Download Results
                </button>
              )}
              
              <button
                onClick={resetApp}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* Debug Info */}
        {extractedText && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              Extracted Text (Debug)
            </h2>
            <div className="bg-gray-100 p-4 rounded max-h-64 overflow-y-auto">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                {extractedText.substring(0, 1000)}...
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;