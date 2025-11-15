import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './NewProject.css';
import { API_URL } from '../config';

const API_BASE_URL = API_URL;

interface ProjectFormData {
  project_name: string;
  address_line_1: string;
  address_line_2: string;
  address_line_3: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  additional_details: string;
  estimated_budget: string;
  currency: string;
}

interface Country {
  name: { common: string };
  cca2: string;
  latlng: number[];
}

interface State {
  name: string;
  iso2: string;
  latitude?: string;
  longitude?: string;
}

interface City {
  name: string;
  latitude?: string;
  longitude?: string;
}

interface ApiResponse {
  id: number;
  project_name: string;
  created_by: number;
  created_by_details: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  created_date: string;
  address_line_1?: string;
  address_line_2?: string;
  address_line_3?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  estimated_budget: string;
  currency: string;
  additional_details?: string;
  plans: any[];
  plans_count: number;
}

const NewProject: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState<ProjectFormData>({
    project_name: '',
    address_line_1: '',
    address_line_2: '',
    address_line_3: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    additional_details: '',
    estimated_budget: '0',
    currency: 'USD'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  // Location data
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState('');
  const [selectedStateCode, setSelectedStateCode] = useState('');
  const [mapCenter, setMapCenter] = useState<{ lat: number, lng: number }>({ lat: 40.7128, lng: -74.0060 });
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "dark";
  });

  useEffect(() => {
    const checkTheme = () => {
      const savedTheme = localStorage.getItem("theme");
      const newIsDarkMode = savedTheme === "dark";
      setIsDarkMode(newIsDarkMode);
      document.body.classList.toggle("dark", newIsDarkMode);
    };

    checkTheme();
    window.addEventListener("storage", checkTheme);
    const interval = setInterval(checkTheme, 100);

    return () => {
      window.removeEventListener("storage", checkTheme);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  // Complete states/provinces data for all major countries
  const allStatesData: { [key: string]: State[] } = {
    'US': [
      { name: 'Alabama', iso2: 'AL', latitude: '32.3668', longitude: '-86.7999' },
      { name: 'Alaska', iso2: 'AK', latitude: '66.1605', longitude: '-153.3691' },
      { name: 'Arizona', iso2: 'AZ', latitude: '34.0489', longitude: '-111.0937' },
      { name: 'Arkansas', iso2: 'AR', latitude: '34.9513', longitude: '-92.3809' },
      { name: 'California', iso2: 'CA', latitude: '36.7783', longitude: '-119.4179' },
      { name: 'Colorado', iso2: 'CO', latitude: '39.0598', longitude: '-105.3111' },
      { name: 'Connecticut', iso2: 'CT', latitude: '41.5978', longitude: '-72.7554' },
      { name: 'Delaware', iso2: 'DE', latitude: '39.3185', longitude: '-75.5071' },
      { name: 'Florida', iso2: 'FL', latitude: '27.7663', longitude: '-81.6868' },
      { name: 'Georgia', iso2: 'GA', latitude: '33.0406', longitude: '-83.6431' },
      { name: 'Hawaii', iso2: 'HI', latitude: '21.0943', longitude: '-157.4983' },
      { name: 'Idaho', iso2: 'ID', latitude: '44.2405', longitude: '-114.4788' },
      { name: 'Illinois', iso2: 'IL', latitude: '40.3363', longitude: '-89.0022' },
      { name: 'Indiana', iso2: 'IN', latitude: '39.8494', longitude: '-86.2583' },
      { name: 'Iowa', iso2: 'IA', latitude: '42.0115', longitude: '-93.2105' },
      { name: 'Kansas', iso2: 'KS', latitude: '38.5266', longitude: '-96.7265' },
      { name: 'Kentucky', iso2: 'KY', latitude: '37.6681', longitude: '-84.6701' },
      { name: 'Louisiana', iso2: 'LA', latitude: '31.1801', longitude: '-91.8749' },
      { name: 'Maine', iso2: 'ME', latitude: '44.6939', longitude: '-69.3819' },
      { name: 'Maryland', iso2: 'MD', latitude: '39.0639', longitude: '-76.8021' },
      { name: 'Massachusetts', iso2: 'MA', latitude: '42.2081', longitude: '-71.0275' },
      { name: 'Michigan', iso2: 'MI', latitude: '43.3266', longitude: '-84.5361' },
      { name: 'Minnesota', iso2: 'MN', latitude: '45.6945', longitude: '-93.9002' },
      { name: 'Mississippi', iso2: 'MS', latitude: '32.7673', longitude: '-89.6812' },
      { name: 'Missouri', iso2: 'MO', latitude: '38.4561', longitude: '-92.2884' },
      { name: 'Montana', iso2: 'MT', latitude: '47.0527', longitude: '-110.2143' },
      { name: 'Nebraska', iso2: 'NE', latitude: '41.1254', longitude: '-98.2681' },
      { name: 'Nevada', iso2: 'NV', latitude: '38.3135', longitude: '-117.0554' },
      { name: 'New Hampshire', iso2: 'NH', latitude: '43.4525', longitude: '-71.5639' },
      { name: 'New Jersey', iso2: 'NJ', latitude: '40.3573', longitude: '-74.4057' },
      { name: 'New Mexico', iso2: 'NM', latitude: '34.8405', longitude: '-106.2485' },
      { name: 'New York', iso2: 'NY', latitude: '43.2994', longitude: '-74.2179' },
      { name: 'North Carolina', iso2: 'NC', latitude: '35.5397', longitude: '-79.8431' },
      { name: 'North Dakota', iso2: 'ND', latitude: '47.5289', longitude: '-99.7840' },
      { name: 'Ohio', iso2: 'OH', latitude: '40.3888', longitude: '-82.7649' },
      { name: 'Oklahoma', iso2: 'OK', latitude: '35.5653', longitude: '-96.9289' },
      { name: 'Oregon', iso2: 'OR', latitude: '44.5672', longitude: '-122.1269' },
      { name: 'Pennsylvania', iso2: 'PA', latitude: '41.2033', longitude: '-77.1945' },
      { name: 'Rhode Island', iso2: 'RI', latitude: '41.6809', longitude: '-71.5118' },
      { name: 'South Carolina', iso2: 'SC', latitude: '33.8569', longitude: '-80.9450' },
      { name: 'South Dakota', iso2: 'SD', latitude: '44.2998', longitude: '-99.4388' },
      { name: 'Tennessee', iso2: 'TN', latitude: '35.7478', longitude: '-86.7923' },
      { name: 'Texas', iso2: 'TX', latitude: '31.9686', longitude: '-99.9018' },
      { name: 'Utah', iso2: 'UT', latitude: '40.1135', longitude: '-111.8535' },
      { name: 'Vermont', iso2: 'VT', latitude: '44.0459', longitude: '-72.7107' },
      { name: 'Virginia', iso2: 'VA', latitude: '37.7693', longitude: '-78.2057' },
      { name: 'Washington', iso2: 'WA', latitude: '47.4009', longitude: '-121.4905' },
      { name: 'West Virginia', iso2: 'WV', latitude: '38.4912', longitude: '-80.9545' },
      { name: 'Wisconsin', iso2: 'WI', latitude: '44.2619', longitude: '-89.6165' },
      { name: 'Wyoming', iso2: 'WY', latitude: '42.7559', longitude: '-107.3025' }
    ],
    'CA': [
      { name: 'Alberta', iso2: 'AB', latitude: '53.9333', longitude: '-116.5765' },
      { name: 'British Columbia', iso2: 'BC_CA', latitude: '53.7267', longitude: '-127.6476' },
      { name: 'Manitoba', iso2: 'MB', latitude: '53.7609', longitude: '-98.8139' },
      { name: 'New Brunswick', iso2: 'NB', latitude: '46.5653', longitude: '-66.4619' },
      { name: 'Newfoundland and Labrador', iso2: 'NL', latitude: '53.1355', longitude: '-57.6604' },
      { name: 'Northwest Territories', iso2: 'NT', latitude: '64.8255', longitude: '-124.8457' },
      { name: 'Nova Scotia', iso2: 'NS', latitude: '44.6820', longitude: '-63.7443' },
      { name: 'Nunavut', iso2: 'NU', latitude: '70.2998', longitude: '-83.1076' },
      { name: 'Ontario', iso2: 'ON', latitude: '51.2538', longitude: '-85.3232' },
      { name: 'Prince Edward Island', iso2: 'PE', latitude: '46.5107', longitude: '-63.4168' },
      { name: 'Quebec', iso2: 'QC', latitude: '52.9399', longitude: '-73.5491' },
      { name: 'Saskatchewan', iso2: 'SK', latitude: '52.9399', longitude: '-106.4509' },
      { name: 'Yukon', iso2: 'YT', latitude: '64.0685', longitude: '-139.0686' }
    ],
    'IN': [
      { name: 'Andhra Pradesh', iso2: 'AP', latitude: '15.9129', longitude: '79.7400' },
      { name: 'Arunachal Pradesh', iso2: 'AR', latitude: '28.2180', longitude: '94.7278' },
      { name: 'Assam', iso2: 'AS', latitude: '26.2006', longitude: '92.9376' },
      { name: 'Bihar', iso2: 'BR', latitude: '25.0961', longitude: '85.3131' },
      { name: 'Chhattisgarh', iso2: 'CG', latitude: '21.2787', longitude: '81.8661' },
      { name: 'Goa', iso2: 'GA', latitude: '15.2993', longitude: '74.1240' },
      { name: 'Gujarat', iso2: 'GJ', latitude: '22.2587', longitude: '71.1924' },
      { name: 'Haryana', iso2: 'HR', latitude: '29.0588', longitude: '76.0856' },
      { name: 'Himachal Pradesh', iso2: 'HP', latitude: '31.1048', longitude: '77.1734' },
      { name: 'Jharkhand', iso2: 'JH', latitude: '23.6102', longitude: '85.2799' },
      { name: 'Karnataka', iso2: 'KA', latitude: '15.3173', longitude: '75.7139' },
      { name: 'Kerala', iso2: 'KL', latitude: '10.8505', longitude: '76.2711' },
      { name: 'Madhya Pradesh', iso2: 'MP', latitude: '22.9734', longitude: '78.6569' },
      { name: 'Maharashtra', iso2: 'MH', latitude: '19.7515', longitude: '75.7139' },
      { name: 'Manipur', iso2: 'MN', latitude: '24.6637', longitude: '93.9063' },
      { name: 'Meghalaya', iso2: 'ML', latitude: '25.4670', longitude: '91.3662' },
      { name: 'Mizoram', iso2: 'MZ', latitude: '23.1645', longitude: '92.9376' },
      { name: 'Nagaland', iso2: 'NL', latitude: '26.1584', longitude: '94.5624' },
      { name: 'Odisha', iso2: 'OR', latitude: '20.9517', longitude: '85.0985' },
      { name: 'Punjab', iso2: 'PB', latitude: '31.1471', longitude: '75.3412' },
      { name: 'Rajasthan', iso2: 'RJ_IN', latitude: '27.0238', longitude: '74.2179' },
      { name: 'Sikkim', iso2: 'SK', latitude: '27.5330', longitude: '88.5122' },
      { name: 'Tamil Nadu', iso2: 'TN', latitude: '11.1271', longitude: '78.6569' },
      { name: 'Telangana', iso2: 'TG', latitude: '18.1124', longitude: '79.0193' },
      { name: 'Tripura', iso2: 'TR', latitude: '23.9408', longitude: '91.9882' },
      { name: 'Uttar Pradesh', iso2: 'UP', latitude: '26.8467', longitude: '80.9462' },
      { name: 'Uttarakhand', iso2: 'UK', latitude: '30.0668', longitude: '79.0193' },
      { name: 'West Bengal', iso2: 'WB', latitude: '22.9868', longitude: '87.8550' },
      // Union Territories
      { name: 'Andaman and Nicobar Islands', iso2: 'AN', latitude: '11.7401', longitude: '92.6586' },
      { name: 'Chandigarh', iso2: 'CH', latitude: '30.7333', longitude: '76.7794' },
      { name: 'Dadra and Nagar Haveli and Daman and Diu', iso2: 'DN', latitude: '20.1809', longitude: '73.0169' },
      { name: 'Delhi', iso2: 'DL', latitude: '28.7041', longitude: '77.1025' },
      { name: 'Jammu and Kashmir', iso2: 'JK', latitude: '34.0837', longitude: '74.7973' },
      { name: 'Ladakh', iso2: 'LA', latitude: '34.1526', longitude: '77.5770' },
      { name: 'Lakshadweep', iso2: 'LD', latitude: '10.5667', longitude: '72.6417' },
      { name: 'Puducherry', iso2: 'PY', latitude: '11.9416', longitude: '79.8083' }
    ],
    'GB': [
      { name: 'England', iso2: 'ENG', latitude: '52.3555', longitude: '-1.1743' },
      { name: 'Scotland', iso2: 'SCT', latitude: '56.4907', longitude: '-4.2026' },
      { name: 'Wales', iso2: 'WLS', latitude: '52.1307', longitude: '-3.7837' },
      { name: 'Northern Ireland', iso2: 'NIR', latitude: '54.7877', longitude: '-6.4923' }
    ],
    'AU': [
      { name: 'Australian Capital Territory', iso2: 'ACT', latitude: '-35.4735', longitude: '149.0124' },
      { name: 'New South Wales', iso2: 'NSW', latitude: '-31.2532', longitude: '146.9211' },
      { name: 'Northern Territory', iso2: 'NT', latitude: '-19.4914', longitude: '132.5510' },
      { name: 'Queensland', iso2: 'QLD', latitude: '-20.9176', longitude: '142.7028' },
      { name: 'South Australia', iso2: 'SA', latitude: '-30.0002', longitude: '136.2092' },
      { name: 'Tasmania', iso2: 'TAS', latitude: '-41.4545', longitude: '145.9707' },
      { name: 'Victoria', iso2: 'VIC', latitude: '-36.8485', longitude: '144.2864' },
      { name: 'Western Australia', iso2: 'WA', latitude: '-27.6728', longitude: '121.6283' }
    ],
    'DE': [
      { name: 'Baden-Württemberg', iso2: 'BW', latitude: '48.6616', longitude: '9.3501' },
      { name: 'Bavaria', iso2: 'BY', latitude: '49.0134', longitude: '11.4041' },
      { name: 'Berlin', iso2: 'BE', latitude: '52.5200', longitude: '13.4050' },
      { name: 'Brandenburg', iso2: 'BB', latitude: '52.4125', longitude: '12.5316' },
      { name: 'Bremen', iso2: 'HB', latitude: '53.0793', longitude: '8.8017' },
      { name: 'Hamburg', iso2: 'HH', latitude: '53.5511', longitude: '9.9937' },
      { name: 'Hesse', iso2: 'HE', latitude: '50.6520', longitude: '9.1624' },
      { name: 'Lower Saxony', iso2: 'NI', latitude: '52.6367', longitude: '9.8451' },
      { name: 'Mecklenburg-Vorpommern', iso2: 'MV', latitude: '53.6127', longitude: '12.4296' },
      { name: 'North Rhine-Westphalia', iso2: 'NW', latitude: '51.4332', longitude: '7.6616' },
      { name: 'Rhineland-Palatinate', iso2: 'RP', latitude: '49.9129', longitude: '7.4530' },
      { name: 'Saarland', iso2: 'SL', latitude: '49.3964', longitude: '6.8543' },
      { name: 'Saxony', iso2: 'SN', latitude: '51.1045', longitude: '13.2017' },
      { name: 'Saxony-Anhalt', iso2: 'ST', latitude: '51.9503', longitude: '11.6923' },
      { name: 'Schleswig-Holstein', iso2: 'SH', latitude: '54.2194', longitude: '9.6961' },
      { name: 'Thuringia', iso2: 'TH', latitude: '50.9781', longitude: '11.0299' }
    ],
    'BR': [
      { name: 'Acre', iso2: 'AC', latitude: '-8.7773', longitude: '-70.5550' },
      { name: 'Alagoas', iso2: 'AL', latitude: '-9.5713', longitude: '-36.7820' },
      { name: 'Amapá', iso2: 'AP', latitude: '1.4144', longitude: '-51.7865' },
      { name: 'Amazonas', iso2: 'AM', latitude: '-3.4168', longitude: '-65.8561' },
      { name: 'Bahia', iso2: 'BA', latitude: '-12.5797', longitude: '-41.7007' },
      { name: 'Ceará', iso2: 'CE', latitude: '-5.4984', longitude: '-39.3206' },
      { name: 'Distrito Federal', iso2: 'DF', latitude: '-15.7998', longitude: '-47.8645' },
      { name: 'Espírito Santo', iso2: 'ES', latitude: '-19.1834', longitude: '-40.3089' },
      { name: 'Goiás', iso2: 'GO', latitude: '-15.8270', longitude: '-49.8362' },
      { name: 'Maranhão', iso2: 'MA', latitude: '-4.9609', longitude: '-45.2744' },
      { name: 'Mato Grosso', iso2: 'MT', latitude: '-12.6819', longitude: '-56.9211' },
      { name: 'Mato Grosso do Sul', iso2: 'MS', latitude: '-20.7722', longitude: '-54.7852' },
      { name: 'Minas Gerais', iso2: 'MG', latitude: '-18.5122', longitude: '-44.5550' },
      { name: 'Pará', iso2: 'PA', latitude: '-3.9019', longitude: '-52.4764' },
      { name: 'Paraíba', iso2: 'PB', latitude: '-7.2399', longitude: '-36.7820' },
      { name: 'Paraná', iso2: 'PR', latitude: '-24.8932', longitude: '-51.4934' },
      { name: 'Pernambuco', iso2: 'PE', latitude: '-8.8137', longitude: '-36.9541' },
      { name: 'Piauí', iso2: 'PI', latitude: '-8.5692', longitude: '-42.2584' },
      { name: 'Rio de Janeiro', iso2: 'RJ', latitude: '-22.9099', longitude: '-43.2095' },
      { name: 'Rio Grande do Norte', iso2: 'RN', latitude: '-5.4026', longitude: '-36.9541' },
      { name: 'Rio Grande do Sul', iso2: 'RS', latitude: '-30.0346', longitude: '-51.2177' },
      { name: 'Rondônia', iso2: 'RO', latitude: '-11.5057', longitude: '-63.5806' },
      { name: 'Roraima', iso2: 'RR', latitude: '2.7376', longitude: '-62.0751' },
      { name: 'Santa Catarina', iso2: 'SC', latitude: '-27.2423', longitude: '-50.2189' },
      { name: 'São Paulo', iso2: 'SP', latitude: '-23.5505', longitude: '-46.6333' },
      { name: 'Sergipe', iso2: 'SE', latitude: '-10.5741', longitude: '-37.3857' },
      { name: 'Tocantins', iso2: 'TO', latitude: '-10.1753', longitude: '-48.2982' }
    ],
    'CN': [
      { name: 'Anhui', iso2: 'AH', latitude: '31.8612', longitude: '117.2264' },
      { name: 'Beijing', iso2: 'BJ', latitude: '39.9042', longitude: '116.4074' },
      { name: 'Chongqing', iso2: 'CQ', latitude: '29.4316', longitude: '106.9123' },
      { name: 'Fujian', iso2: 'FJ', latitude: '26.0789', longitude: '117.9874' },
      { name: 'Gansu', iso2: 'GS', latitude: '36.0611', longitude: '103.8343' },
      { name: 'Guangdong', iso2: 'GD', latitude: '23.3417', longitude: '113.4244' },
      { name: 'Guangxi', iso2: 'GX', latitude: '23.2639', longitude: '108.3267' },
      { name: 'Guizhou', iso2: 'GZ', latitude: '26.8154', longitude: '106.8748' },
      { name: 'Hainan', iso2: 'HI', latitude: '19.1959', longitude: '109.7453' },
      { name: 'Hebei', iso2: 'HE', latitude: '38.0428', longitude: '114.5149' },
      { name: 'Heilongjiang', iso2: 'HL', latitude: '47.8620', longitude: '127.7615' },
      { name: 'Henan', iso2: 'HA', latitude: '33.8818', longitude: '113.6140' },
      { name: 'Hong Kong', iso2: 'HK', latitude: '22.3193', longitude: '114.1694' },
      { name: 'Hubei', iso2: 'HB', latitude: '30.9756', longitude: '112.2707' },
      { name: 'Hunan', iso2: 'HN', latitude: '27.6104', longitude: '111.7088' },
      { name: 'Inner Mongolia', iso2: 'NM', latitude: '44.0935', longitude: '113.9448' },
      { name: 'Jiangsu', iso2: 'JS', latitude: '32.9711', longitude: '119.4550' },
      { name: 'Jiangxi', iso2: 'JX', latitude: '27.6140', longitude: '115.7221' },
      { name: 'Jilin', iso2: 'JL', latitude: '43.6661', longitude: '126.1923' },
      { name: 'Liaoning', iso2: 'LN', latitude: '41.2956', longitude: '122.6085' },
      { name: 'Macau', iso2: 'MO', latitude: '22.1987', longitude: '113.5439' },
      { name: 'Ningxia', iso2: 'NX', latitude: '37.2692', longitude: '106.1655' },
      { name: 'Qinghai', iso2: 'QH', latitude: '35.7452', longitude: '95.9956' },
      { name: 'Shaanxi', iso2: 'SN', latitude: '35.1917', longitude: '108.8701' },
      { name: 'Shandong', iso2: 'SD', latitude: '36.3427', longitude: '118.1498' },
      { name: 'Shanghai', iso2: 'SH', latitude: '31.2304', longitude: '121.4737' },
      { name: 'Shanxi', iso2: 'SX', latitude: '37.5777', longitude: '112.2922' },
      { name: 'Sichuan', iso2: 'SC', latitude: '30.6171', longitude: '102.7103' },
      { name: 'Taiwan', iso2: 'TW', latitude: '23.9739', longitude: '120.9820' },
      { name: 'Tianjin', iso2: 'TJ', latitude: '39.3054', longitude: '117.3230' },
      { name: 'Tibet', iso2: 'XZ', latitude: '31.6927', longitude: '88.0924' },
      { name: 'Xinjiang', iso2: 'XJ', latitude: '41.1129', longitude: '85.2401' },
      { name: 'Yunnan', iso2: 'YN', latitude: '25.0400', longitude: '101.4922' },
      { name: 'Zhejiang', iso2: 'ZJ', latitude: '29.1416', longitude: '120.0985' }
    ],
    'RU': [
      { name: 'Adygea Republic', iso2: 'AD', latitude: '44.6939', longitude: '40.1520' },
      { name: 'Altai Krai', iso2: 'AL', latitude: '53.3606', longitude: '83.7636' },
      { name: 'Altai Republic', iso2: 'GO', latitude: '50.7116', longitude: '86.8720' },
      { name: 'Amur Oblast', iso2: 'AMU', latitude: '52.5634', longitude: '127.9407' },
      { name: 'Arkhangelsk Oblast', iso2: 'ARK', latitude: '64.5401', longitude: '40.5433' },
      { name: 'Astrakhan Oblast', iso2: 'AST', latitude: '47.2213', longitude: '47.9722' },
      { name: 'Bashkortostan Republic', iso2: 'BA', latitude: '54.7431', longitude: '55.9678' },
      { name: 'Belgorod Oblast', iso2: 'BEL', latitude: '50.6199', longitude: '36.5884' },
      { name: 'Bryansk Oblast', iso2: 'BRY', latitude: '53.2434', longitude: '34.3656' },
      { name: 'Buryatia Republic', iso2: 'BU', latitude: '52.9977', longitude: '107.6549' },
      { name: 'Chelyabinsk Oblast', iso2: 'CHE', latitude: '54.4296', longitude: '60.8136' },
      { name: 'Chuvash Republic', iso2: 'CU', latitude: '55.5004', longitude: '47.2483' },
      { name: 'Irkutsk Oblast', iso2: 'IRK', latitude: '53.0870', longitude: '103.9059' },
      { name: 'Kaliningrad Oblast', iso2: 'KGD', latitude: '54.7065', longitude: '20.5110' },
      { name: 'Kamchatka Krai', iso2: 'KAM', latitude: '56.0184', longitude: '159.3791' },
      { name: 'Kemerovo Oblast', iso2: 'KEM', latitude: '54.8985', longitude: '85.6918' },
      { name: 'Moscow', iso2: 'MOW', latitude: '55.7558', longitude: '37.6176' },
      { name: 'Moscow Oblast', iso2: 'MOS', latitude: '55.5807', longitude: '36.8251' },
      { name: 'Murmansk Oblast', iso2: 'MUR', latitude: '67.9348', longitude: '33.0876' },
      { name: 'Nizhny Novgorod Oblast', iso2: 'NIZ', latitude: '55.5282', longitude: '44.0075' },
      { name: 'Novosibirsk Oblast', iso2: 'NVS', latitude: '55.1849', longitude: '82.4452' },
      { name: 'Omsk Oblast', iso2: 'OMS', latitude: '56.5430', longitude: '73.4158' },
      { name: 'Perm Krai', iso2: 'PER', latitude: '59.0153', longitude: '54.4453' },
      { name: 'Primorsky Krai', iso2: 'PRI', latitude: '44.5923', longitude: '134.0047' },
      { name: 'Rostov Oblast', iso2: 'ROS', latitude: '47.2357', longitude: '39.7015' },
      { name: 'Saint Petersburg', iso2: 'SPE', latitude: '59.9311', longitude: '30.3609' },
      { name: 'Samara Oblast', iso2: 'SAM', latitude: '53.2001', longitude: '50.1500' },
      { name: 'Sverdlovsk Oblast', iso2: 'SVE', latitude: '58.5966', longitude: '61.7987' },
      { name: 'Tatarstan Republic', iso2: 'TA', latitude: '55.7887', longitude: '49.1221' },
      { name: 'Tomsk Oblast', iso2: 'TOM', latitude: '58.5282', longitude: '82.9326' },
      { name: 'Tula Oblast', iso2: 'TUL', latitude: '54.0735', longitude: '37.6068' },
      { name: 'Tver Oblast', iso2: 'TVE', latitude: '56.8587', longitude: '35.9176' },
      { name: 'Tyumen Oblast', iso2: 'TYU', latitude: '57.1522', longitude: '65.5272' },
      { name: 'Volgograd Oblast', iso2: 'VGG', latitude: '50.4501', longitude: '44.5018' },
      { name: 'Voronezh Oblast', iso2: 'VOR', latitude: '51.6720', longitude: '39.1843' },
      { name: 'Yaroslavl Oblast', iso2: 'YAR', latitude: '57.6261', longitude: '39.8845' }
    ],
    'FR': [
      { name: 'Auvergne-Rhône-Alpes', iso2: 'ARA', latitude: '45.7640', longitude: '4.8357' },
      { name: 'Bourgogne-Franche-Comté', iso2: 'BFC', latitude: '47.2802', longitude: '4.9990' },
      { name: 'Brittany', iso2: 'BRE', latitude: '48.2020', longitude: '-2.9326' },
      { name: 'Centre-Val de Loire', iso2: 'CVL', latitude: '47.7516', longitude: '1.6751' },
      { name: 'Corsica', iso2: 'COR', latitude: '42.0396', longitude: '9.0129' },
      { name: 'Grand Est', iso2: 'GES', latitude: '48.7000', longitude: '6.1878' },
      { name: 'Hauts-de-France', iso2: 'HDF', latitude: '50.4801', longitude: '2.7937' },
      { name: 'Île-de-France', iso2: 'IDF', latitude: '48.8499', longitude: '2.6370' },
      { name: 'Normandy', iso2: 'NOR', latitude: '49.1829', longitude: '0.3707' },
      { name: 'Nouvelle-Aquitaine', iso2: 'NAQ', latitude: '45.7640', longitude: '0.8152' },
      { name: 'Occitanie', iso2: 'OCC', latitude: '43.8927', longitude: '3.2827' },
      { name: 'Pays de la Loire', iso2: 'PDL', latitude: '47.7632', longitude: '-0.3301' },
      { name: 'Provence-Alpes-Côte d\'Azur', iso2: 'PAC', latitude: '43.9352', longitude: '6.0679' }
    ],
    'JP': [
      { name: 'Hokkaido', iso2: 'HOK', latitude: '43.2203', longitude: '142.8635' },
      { name: 'Aomori', iso2: 'AOM', latitude: '40.7834', longitude: '140.7405' },
      { name: 'Iwate', iso2: 'IWT', latitude: '39.7036', longitude: '141.1527' },
      { name: 'Miyagi', iso2: 'MYG', latitude: '38.4316', longitude: '141.0078' },
      { name: 'Akita', iso2: 'AKT', latitude: '39.7186', longitude: '140.1024' },
      { name: 'Yamagata', iso2: 'YMG', latitude: '38.2404', longitude: '140.3633' },
      { name: 'Fukushima', iso2: 'FKS', latitude: '37.7503', longitude: '140.4676' },
      { name: 'Ibaraki', iso2: 'IBR', latitude: '36.3418', longitude: '140.4468' },
      { name: 'Tochigi', iso2: 'TCG', latitude: '36.5657', longitude: '139.8836' },
      { name: 'Gunma', iso2: 'GNM', latitude: '36.3910', longitude: '139.0608' },
      { name: 'Saitama', iso2: 'STM', latitude: '35.8617', longitude: '139.6455' },
      { name: 'Chiba', iso2: 'CHB', latitude: '35.6074', longitude: '140.1065' },
      { name: 'Tokyo', iso2: 'TKY', latitude: '35.6762', longitude: '139.6503' },
      { name: 'Kanagawa', iso2: 'KNG', latitude: '35.4478', longitude: '139.6425' },
      { name: 'Niigata', iso2: 'NIG', latitude: '37.9026', longitude: '139.0232' },
      { name: 'Toyama', iso2: 'TYM', latitude: '36.6953', longitude: '137.2113' },
      { name: 'Ishikawa', iso2: 'ISK', latitude: '36.5944', longitude: '136.6256' },
      { name: 'Fukui', iso2: 'FKI', latitude: '35.9045', longitude: '136.1882' },
      { name: 'Yamanashi', iso2: 'YMN', latitude: '35.6638', longitude: '138.5683' },
      { name: 'Nagano', iso2: 'NGN', latitude: '36.2048', longitude: '138.2529' },
      { name: 'Gifu', iso2: 'GIF', latitude: '35.3911', longitude: '136.7222' },
      { name: 'Shizuoka', iso2: 'SZO', latitude: '34.9756', longitude: '138.3828' },
      { name: 'Aichi', iso2: 'AIC', latitude: '35.1803', longitude: '136.9066' },
      { name: 'Mie', iso2: 'MIE', latitude: '34.2302', longitude: '136.5086' },
      { name: 'Shiga', iso2: 'SHG', latitude: '35.0045', longitude: '135.8686' },
      { name: 'Kyoto', iso2: 'KYT', latitude: '35.2111', longitude: '135.7556' },
      { name: 'Osaka', iso2: 'OSK', latitude: '34.6937', longitude: '135.5023' },
      { name: 'Hyogo', iso2: 'HYG', latitude: '34.6913', longitude: '135.1830' },
      { name: 'Nara', iso2: 'NAR', latitude: '34.6851', longitude: '135.8050' },
      { name: 'Wakayama', iso2: 'WKY', latitude: '34.2261', longitude: '135.1675' },
      { name: 'Tottori', iso2: 'TTR', latitude: '35.5038', longitude: '134.2388' },
      { name: 'Shimane', iso2: 'SMN', latitude: '35.4723', longitude: '133.0505' },
      { name: 'Okayama', iso2: 'OKY', latitude: '34.6617', longitude: '133.9349' },
      { name: 'Hiroshima', iso2: 'HRS', latitude: '34.3963', longitude: '132.4596' },
      { name: 'Yamaguchi', iso2: 'YMC', latitude: '34.1859', longitude: '131.4706' },
      { name: 'Tokushima', iso2: 'TKS', latitude: '34.0658', longitude: '134.5592' },
      { name: 'Kagawa', iso2: 'KGW', latitude: '34.3401', longitude: '134.0430' },
      { name: 'Ehime', iso2: 'EHM', latitude: '33.8416', longitude: '132.7658' },
      { name: 'Kochi', iso2: 'KCH', latitude: '33.5597', longitude: '133.5311' },
      { name: 'Fukuoka', iso2: 'FKO', latitude: '33.6064', longitude: '130.4181' },
      { name: 'Saga', iso2: 'SAG', latitude: '33.2494', longitude: '130.2989' },
      { name: 'Nagasaki', iso2: 'NGS', latitude: '32.7503', longitude: '129.8779' },
      { name: 'Kumamoto', iso2: 'KMM', latitude: '32.7898', longitude: '130.7417' },
      { name: 'Oita', iso2: 'OIT', latitude: '33.2382', longitude: '131.6126' },
      { name: 'Miyazaki', iso2: 'MYZ', latitude: '31.9077', longitude: '131.4202' },
      { name: 'Kagoshima', iso2: 'KGS', latitude: '31.5604', longitude: '130.5581' },
      { name: 'Okinawa', iso2: 'OKN', latitude: '26.2124', longitude: '127.6792' }
    ],
    'IT': [
      { name: 'Abruzzo', iso2: 'ABR', latitude: '42.3498', longitude: '13.3995' },
      { name: 'Basilicata', iso2: 'BAS', latitude: '40.6386', longitude: '15.8059' },
      { name: 'Calabria', iso2: 'CAL', latitude: '38.9072', longitude: '16.5947' },
      { name: 'Campania', iso2: 'CAM', latitude: '40.8359', longitude: '14.2488' },
      { name: 'Emilia-Romagna', iso2: 'EMR', latitude: '44.4949', longitude: '11.3426' },
      { name: 'Friuli-Venezia Giulia', iso2: 'FVG', latitude: '46.0748', longitude: '13.2335' },
      { name: 'Lazio', iso2: 'LAZ', latitude: '41.8719', longitude: '12.5674' },
      { name: 'Liguria', iso2: 'LIG', latitude: '44.4056', longitude: '8.9463' },
      { name: 'Lombardy', iso2: 'LOM', latitude: '45.4773', longitude: '10.0081' },
      { name: 'Marche', iso2: 'MAR', latitude: '43.6158', longitude: '13.5189' },
      { name: 'Molise', iso2: 'MOL', latitude: '41.5616', longitude: '14.6682' },
      { name: 'Piedmont', iso2: 'PIE', latitude: '45.0732', longitude: '7.6801' },
      { name: 'Puglia', iso2: 'PUG', latitude: '41.1259', longitude: '16.8618' },
      { name: 'Sardinia', iso2: 'SAR', latitude: '40.1209', longitude: '9.0129' },
      { name: 'Sicily', iso2: 'SIC', latitude: '37.5999', longitude: '14.0153' },
      { name: 'Trentino-Alto Adige', iso2: 'TAA', latitude: '46.4982', longitude: '11.3548' },
      { name: 'Tuscany', iso2: 'TOS', latitude: '43.7711', longitude: '11.2486' },
      { name: 'Umbria', iso2: 'UMB', latitude: '43.1122', longitude: '12.3888' },
      { name: 'Valle d\'Aosta', iso2: 'VDA', latitude: '45.7373', longitude: '7.3206' },
      { name: 'Veneto', iso2: 'VEN', latitude: '45.4299', longitude: '12.3372' }
    ],
    'ES': [
      { name: 'Andalusia', iso2: 'AN', latitude: '37.8882', longitude: '-4.7794' },
      { name: 'Aragon', iso2: 'AR', latitude: '41.6488', longitude: '-0.8890' },
      { name: 'Asturias', iso2: 'AS', latitude: '43.3614', longitude: '-5.8593' },
      { name: 'Balearic Islands', iso2: 'IB', latitude: '39.6953', longitude: '3.0176' },
      { name: 'Basque Country', iso2: 'PV', latitude: '43.2630', longitude: '-2.9350' },
      { name: 'Canary Islands', iso2: 'CN', latitude: '28.2916', longitude: '-16.6291' },
      { name: 'Cantabria', iso2: 'CB', latitude: '43.4647', longitude: '-3.8044' },
      { name: 'Castile and León', iso2: 'CL', latitude: '41.6523', longitude: '-4.7245' },
      { name: 'Castile-La Mancha', iso2: 'CM', latitude: '39.8628', longitude: '-2.9776' },
      { name: 'Catalonia', iso2: 'CT', latitude: '41.8211', longitude: '1.8634' },
      { name: 'Extremadura', iso2: 'EX', latitude: '39.2362', longitude: '-6.1849' },
      { name: 'Galicia', iso2: 'GA', latitude: '42.7593', longitude: '-8.1308' },
      { name: 'La Rioja', iso2: 'RI', latitude: '42.4627', longitude: '-2.4451' },
      { name: 'Madrid', iso2: 'MD', latitude: '40.4637', longitude: '-3.7492' },
      { name: 'Murcia', iso2: 'MC', latitude: '38.0215', longitude: '-1.1739' },
      { name: 'Navarre', iso2: 'NC', latitude: '42.6954', longitude: '-1.6761' },
      { name: 'Valencia', iso2: 'VC', latitude: '39.4840', longitude: '-0.7533' }
    ],
    'MX': [
      { name: 'Aguascalientes', iso2: 'AG', latitude: '21.8818', longitude: '-102.2916' },
      { name: 'Baja California', iso2: 'BC_MX', latitude: '30.8406', longitude: '-115.2838' },
      { name: 'Baja California Sur', iso2: 'BS', latitude: '26.0444', longitude: '-111.6660' },
      { name: 'Campeche', iso2: 'CM', latitude: '19.8301', longitude: '-90.5349' },
      { name: 'Chiapas', iso2: 'CS', latitude: '16.7569', longitude: '-93.1292' },
      { name: 'Chihuahua', iso2: 'CH', latitude: '28.6329', longitude: '-106.0691' },
      { name: 'Coahuila', iso2: 'CO', latitude: '27.0587', longitude: '-101.7068' },
      { name: 'Colima', iso2: 'CL', latitude: '19.2452', longitude: '-103.7240' },
      { name: 'Durango', iso2: 'DG', latitude: '24.5594', longitude: '-104.6593' },
      { name: 'Guanajuato', iso2: 'GT', latitude: '21.0190', longitude: '-101.2574' },
      { name: 'Guerrero', iso2: 'GR', latitude: '17.4392', longitude: '-99.5451' },
      { name: 'Hidalgo', iso2: 'HG', latitude: '20.0910', longitude: '-98.7624' },
      { name: 'Jalisco', iso2: 'JA', latitude: '20.6597', longitude: '-103.3496' },
      { name: 'Mexico', iso2: 'MX', latitude: '19.2808', longitude: '-99.6560' },
      { name: 'Michoacán', iso2: 'MI', latitude: '19.5665', longitude: '-101.7068' },
      { name: 'Morelos', iso2: 'MO', latitude: '18.6813', longitude: '-99.1013' },
      { name: 'Nayarit', iso2: 'NA', latitude: '21.7514', longitude: '-104.8455' },
      { name: 'Nuevo León', iso2: 'NL', latitude: '25.5922', longitude: '-99.9962' },
      { name: 'Oaxaca', iso2: 'OA', latitude: '17.0732', longitude: '-96.7266' },
      { name: 'Puebla', iso2: 'PU', latitude: '19.0414', longitude: '-98.2063' },
      { name: 'Querétaro', iso2: 'QT', latitude: '20.5888', longitude: '-100.3899' },
      { name: 'Quintana Roo', iso2: 'QR', latitude: '19.1817', longitude: '-88.4791' },
      { name: 'San Luis Potosí', iso2: 'SL', latitude: '22.1565', longitude: '-100.9855' },
      { name: 'Sinaloa', iso2: 'SI', latitude: '25.1721', longitude: '-107.4795' },
      { name: 'Sonora', iso2: 'SO', latitude: '29.2972', longitude: '-110.3309' },
      { name: 'Tabasco', iso2: 'TB', latitude: '17.8409', longitude: '-92.6189' },
      { name: 'Tamaulipas', iso2: 'TM', latitude: '24.2669', longitude: '-98.8363' },
      { name: 'Tlaxcala', iso2: 'TL', latitude: '19.3181', longitude: '-98.2375' },
      { name: 'Veracruz', iso2: 'VE', latitude: '19.1738', longitude: '-96.1342' },
      { name: 'Yucatán', iso2: 'YU', latitude: '20.7099', longitude: '-89.0943' },
      { name: 'Zacatecas', iso2: 'ZA', latitude: '22.7709', longitude: '-102.5832' }
    ]
  };

  // Comprehensive city data with extensive Indian cities
  const allCitiesData: { [key: string]: City[] } = {
    // US Cities
    'CA': [
      { name: 'Los Angeles', latitude: '34.0522', longitude: '-118.2437' },
      { name: 'San Francisco', latitude: '37.7749', longitude: '-122.4194' },
      { name: 'San Diego', latitude: '32.7157', longitude: '-117.1611' },
      { name: 'Sacramento', latitude: '38.5816', longitude: '-121.4944' },
      { name: 'San Jose', latitude: '37.3382', longitude: '-121.8863' },
      { name: 'Fresno', latitude: '36.7378', longitude: '-119.7871' },
      { name: 'Long Beach', latitude: '33.7701', longitude: '-118.1937' },
      { name: 'Oakland', latitude: '37.8044', longitude: '-122.2712' },
      { name: 'Bakersfield', latitude: '35.3733', longitude: '-119.0187' },
      { name: 'Anaheim', latitude: '33.8366', longitude: '-117.9143' }
    ],
    'NY': [
      { name: 'New York', latitude: '40.7128', longitude: '-74.0060' },
      { name: 'Buffalo', latitude: '42.8864', longitude: '-78.8784' },
      { name: 'Albany', latitude: '42.6526', longitude: '-73.7562' },
      { name: 'Syracuse', latitude: '43.0481', longitude: '-76.1474' },
      { name: 'Rochester', latitude: '43.1566', longitude: '-77.6088' },
      { name: 'Yonkers', latitude: '40.9312', longitude: '-73.8988' },
      { name: 'Schenectady', latitude: '42.8142', longitude: '-73.9396' },
      { name: 'Utica', latitude: '43.1009', longitude: '-75.2327' }
    ],
    'TX': [
      { name: 'Houston', latitude: '29.7604', longitude: '-95.3698' },
      { name: 'Dallas', latitude: '32.7767', longitude: '-96.7970' },
      { name: 'Austin', latitude: '30.2672', longitude: '-97.7431' },
      { name: 'San Antonio', latitude: '29.4241', longitude: '-98.4936' },
      { name: 'Fort Worth', latitude: '32.7555', longitude: '-97.3308' },
      { name: 'El Paso', latitude: '31.7619', longitude: '-106.4850' },
      { name: 'Arlington', latitude: '32.7357', longitude: '-97.1081' },
      { name: 'Corpus Christi', latitude: '27.8006', longitude: '-97.3964' },
      { name: 'Plano', latitude: '33.0198', longitude: '-96.6989' },
      { name: 'Lubbock', latitude: '33.5779', longitude: '-101.8552' }
    ],
    'FL': [
      { name: 'Miami', latitude: '25.7617', longitude: '-80.1918' },
      { name: 'Tampa', latitude: '27.9506', longitude: '-82.4572' },
      { name: 'Orlando', latitude: '28.5383', longitude: '-81.3792' },
      { name: 'Jacksonville', latitude: '30.3322', longitude: '-81.6557' },
      { name: 'St. Petersburg', latitude: '27.7676', longitude: '-82.6403' },
      { name: 'Hialeah', latitude: '25.8576', longitude: '-80.2781' },
      { name: 'Tallahassee', latitude: '30.4518', longitude: '-84.2807' },
      { name: 'Fort Lauderdale', latitude: '26.1224', longitude: '-80.1373' }
    ],

    // Canadian Cities
    'ON': [
      { name: 'Toronto', latitude: '43.6532', longitude: '-79.3832' },
      { name: 'Ottawa', latitude: '45.4215', longitude: '-75.6972' },
      { name: 'Hamilton', latitude: '43.2557', longitude: '-79.8711' },
      { name: 'London', latitude: '42.9849', longitude: '-81.2453' },
      { name: 'Windsor', latitude: '42.3149', longitude: '-83.0364' },
      { name: 'Kingston', latitude: '44.2312', longitude: '-76.4860' },
      { name: 'Kitchener', latitude: '43.4516', longitude: '-80.4925' }
    ],
    'QC': [
      { name: 'Montreal', latitude: '45.5017', longitude: '-73.5673' },
      { name: 'Quebec City', latitude: '46.8139', longitude: '-71.2080' },
      { name: 'Laval', latitude: '45.6066', longitude: '-73.7124' },
      { name: 'Gatineau', latitude: '45.4765', longitude: '-75.7013' },
      { name: 'Sherbrooke', latitude: '45.4042', longitude: '-71.8929' }
    ],
    'BC_CA': [
      { name: 'Vancouver', latitude: '49.2827', longitude: '-123.1207' },
      { name: 'Victoria', latitude: '48.4284', longitude: '-123.3656' },
      { name: 'Surrey', latitude: '49.1913', longitude: '-122.8490' },
      { name: 'Burnaby', latitude: '49.2488', longitude: '-122.9805' },
      { name: 'Richmond', latitude: '49.1666', longitude: '-123.1336' }
    ],
    'AB': [
      { name: 'Calgary', latitude: '51.0447', longitude: '-114.0719' },
      { name: 'Edmonton', latitude: '53.5461', longitude: '-113.4938' },
      { name: 'Red Deer', latitude: '52.2681', longitude: '-113.8112' },
      { name: 'Lethbridge', latitude: '49.6936', longitude: '-112.8451' }
    ],

    // Extensive Indian Cities by State
    'MH': [
      { name: 'Mumbai', latitude: '19.0760', longitude: '72.8777' },
      { name: 'Pune', latitude: '18.5204', longitude: '73.8567' },
      { name: 'Nagpur', latitude: '21.1458', longitude: '79.0882' },
      { name: 'Nashik', latitude: '19.9975', longitude: '73.7898' },
      { name: 'Aurangabad', latitude: '19.8762', longitude: '75.3433' },
      { name: 'Solapur', latitude: '17.6599', longitude: '75.9064' },
      { name: 'Kolhapur', latitude: '16.7050', longitude: '74.2433' },
      { name: 'Sangli', latitude: '16.8524', longitude: '74.5815' },
      { name: 'Malegaon', latitude: '20.5579', longitude: '74.5287' },
      { name: 'Jalgaon', latitude: '21.0077', longitude: '75.5626' },
      { name: 'Akola', latitude: '20.7002', longitude: '77.0082' },
      { name: 'Latur', latitude: '18.4088', longitude: '76.5604' },
      { name: 'Dhule', latitude: '20.9042', longitude: '74.7749' },
      { name: 'Ahmednagar', latitude: '19.0948', longitude: '74.7480' },
      { name: 'Chandrapur', latitude: '19.9615', longitude: '79.2961' },
      { name: 'Parbhani', latitude: '19.2608', longitude: '76.7764' },
      { name: 'Ichalkaranji', latitude: '16.6917', longitude: '74.4608' },
      { name: 'Jalna', latitude: '19.8347', longitude: '75.8845' },
      { name: 'Ambarnath', latitude: '19.1861', longitude: '73.1567' },
      { name: 'Bhiwandi', latitude: '19.3002', longitude: '73.0630' }
    ],
    'KA': [
      { name: 'Bangalore', latitude: '12.9716', longitude: '77.5946' },
      { name: 'Mysore', latitude: '12.2958', longitude: '76.6394' },
      { name: 'Hubli', latitude: '15.3647', longitude: '75.1240' },
      { name: 'Mangalore', latitude: '12.9141', longitude: '74.8560' },
      { name: 'Belgaum', latitude: '15.8497', longitude: '74.4977' },
      { name: 'Gulbarga', latitude: '17.3297', longitude: '76.8343' },
      { name: 'Davanagere', latitude: '14.4644', longitude: '75.9221' },
      { name: 'Bellary', latitude: '15.1394', longitude: '76.9214' },
      { name: 'Bijapur', latitude: '16.8302', longitude: '75.7100' },
      { name: 'Shimoga', latitude: '13.9299', longitude: '75.5681' },
      { name: 'Tumkur', latitude: '13.3379', longitude: '77.1140' },
      { name: 'Raichur', latitude: '16.2120', longitude: '77.3439' },
      { name: 'Bidar', latitude: '17.9104', longitude: '77.5230' },
      { name: 'Hospet', latitude: '15.2687', longitude: '76.3880' },
      { name: 'Gadag', latitude: '15.4167', longitude: '75.6333' },
      { name: 'Udupi', latitude: '13.3409', longitude: '74.7421' }
    ],
    'TN': [
      { name: 'Chennai', latitude: '13.0827', longitude: '80.2707' },
      { name: 'Coimbatore', latitude: '11.0168', longitude: '76.9558' },
      { name: 'Madurai', latitude: '9.9252', longitude: '78.1198' },
      { name: 'Tiruchirappalli', latitude: '10.7905', longitude: '78.7047' },
      { name: 'Salem', latitude: '11.6643', longitude: '78.1460' },
      { name: 'Tirunelveli', latitude: '8.7139', longitude: '77.7567' },
      { name: 'Tiruppur', latitude: '11.1085', longitude: '77.3411' },
      { name: 'Vellore', latitude: '12.9165', longitude: '79.1325' },
      { name: 'Erode', latitude: '11.3410', longitude: '77.7172' },
      { name: 'Thoothukkudi', latitude: '8.7642', longitude: '78.1348' },
      { name: 'Dindigul', latitude: '10.3673', longitude: '77.9803' },
      { name: 'Thanjavur', latitude: '10.7870', longitude: '79.1378' },
      { name: 'Ranipet', latitude: '12.9226', longitude: '79.3332' },
      { name: 'Sivakasi', latitude: '9.4581', longitude: '77.7906' },
      { name: 'Karur', latitude: '10.9601', longitude: '78.0766' },
      { name: 'Udhagamandalam', latitude: '11.4064', longitude: '76.6932' },
      { name: 'Hosur', latitude: '12.7409', longitude: '77.8253' },
      { name: 'Nagercoil', latitude: '8.1778', longitude: '77.4344' },
      { name: 'Kanchipuram', latitude: '12.8185', longitude: '79.7006' }
    ],
    'UP': [
      { name: 'Lucknow', latitude: '26.8467', longitude: '80.9462' },
      { name: 'Kanpur', latitude: '26.4499', longitude: '80.3319' },
      { name: 'Ghaziabad', latitude: '28.6692', longitude: '77.4538' },
      { name: 'Agra', latitude: '27.1767', longitude: '78.0081' },
      { name: 'Meerut', latitude: '28.9845', longitude: '77.7064' },
      { name: 'Varanasi', latitude: '25.3176', longitude: '82.9739' },
      { name: 'Allahabad', latitude: '25.4358', longitude: '81.8463' },
      { name: 'Bareilly', latitude: '28.3670', longitude: '79.4304' },
      { name: 'Aligarh', latitude: '27.8974', longitude: '78.0880' },
      { name: 'Moradabad', latitude: '28.8386', longitude: '78.7733' },
      { name: 'Saharanpur', latitude: '29.9680', longitude: '77.5552' },
      { name: 'Gorakhpur', latitude: '26.7606', longitude: '83.3732' },
      { name: 'Firozabad', latitude: '27.1592', longitude: '78.3957' },
      { name: 'Jhansi', latitude: '25.4484', longitude: '78.5685' },
      { name: 'Muzaffarnagar', latitude: '29.4727', longitude: '77.7085' },
      { name: 'Mathura', latitude: '27.4924', longitude: '77.6737' },
      { name: 'Rampur', latitude: '28.8152', longitude: '79.0250' },
      { name: 'Shahjahanpur', latitude: '27.8806', longitude: '79.9066' },
      { name: 'Farrukhabad', latitude: '27.3923', longitude: '79.5805' },
      { name: 'Mau', latitude: '25.9420', longitude: '83.5611' }
    ],
    'GJ': [
      { name: 'Ahmedabad', latitude: '23.0225', longitude: '72.5714' },
      { name: 'Surat', latitude: '21.1702', longitude: '72.8311' },
      { name: 'Vadodara', latitude: '22.3072', longitude: '73.1812' },
      { name: 'Rajkot', latitude: '22.3039', longitude: '70.8022' },
      { name: 'Bhavnagar', latitude: '21.7645', longitude: '72.1519' },
      { name: 'Jamnagar', latitude: '22.4707', longitude: '70.0577' },
      { name: 'Junagadh', latitude: '21.5222', longitude: '70.4579' },
      { name: 'Gandhinagar', latitude: '23.2156', longitude: '72.6369' },
      { name: 'Anand', latitude: '22.5645', longitude: '72.9289' },
      { name: 'Navsari', latitude: '20.9463', longitude: '72.9520' },
      { name: 'Morbi', latitude: '22.8173', longitude: '70.8328' },
      { name: 'Mahesana', latitude: '23.5880', longitude: '72.3693' },
      { name: 'Bharuch', latitude: '21.7051', longitude: '72.9959' },
      { name: 'Vapi', latitude: '20.3712', longitude: '72.9059' },
      { name: 'Veraval', latitude: '20.9077', longitude: '70.3660' },
      { name: 'Porbandar', latitude: '21.6417', longitude: '69.6293' }
    ],
    'RJ_IN': [
      { name: 'Jaipur', latitude: '26.9124', longitude: '75.7873' },
      { name: 'Jodhpur', latitude: '26.2389', longitude: '73.0243' },
      { name: 'Kota', latitude: '25.2138', longitude: '75.8648' },
      { name: 'Bikaner', latitude: '28.0229', longitude: '73.3119' },
      { name: 'Udaipur', latitude: '24.5854', longitude: '73.7125' },
      { name: 'Ajmer', latitude: '26.4499', longitude: '74.6399' },
      { name: 'Bhilwara', latitude: '25.3407', longitude: '74.6269' },
      { name: 'Alwar', latitude: '27.5530', longitude: '76.6346' },
      { name: 'Bharatpur', latitude: '27.2152', longitude: '77.4999' },
      { name: 'Pali', latitude: '25.7711', longitude: '73.3234' },
      { name: 'Barmer', latitude: '25.7521', longitude: '71.3962' },
      { name: 'Sikar', latitude: '27.6094', longitude: '75.1399' },
      { name: 'Tonk', latitude: '26.1693', longitude: '75.7842' },
      { name: 'Kishangarh', latitude: '26.5928', longitude: '74.8739' }
    ],
    'WB': [
      { name: 'Kolkata', latitude: '22.5726', longitude: '88.3639' },
      { name: 'Howrah', latitude: '22.5958', longitude: '88.2636' },
      { name: 'Durgapur', latitude: '23.4841', longitude: '87.3119' },
      { name: 'Asansol', latitude: '23.6739', longitude: '86.9524' },
      { name: 'Siliguri', latitude: '26.7271', longitude: '88.3953' },
      { name: 'Malda', latitude: '25.0961', longitude: '88.1436' },
      { name: 'Baharampur', latitude: '24.1048', longitude: '88.2518' },
      { name: 'Habra', latitude: '22.8333', longitude: '88.6333' },
      { name: 'Kharagpur', latitude: '22.3460', longitude: '87.2320' },
      { name: 'Shantipur', latitude: '23.2552', longitude: '88.4341' },
      { name: 'Dankuni', latitude: '22.6761', longitude: '88.2783' },
      { name: 'Dhulian', latitude: '24.6833', longitude: '87.9500' },
      { name: 'Raniganj', latitude: '23.6053', longitude: '87.1245' },
      { name: 'Haldia', latitude: '22.0333', longitude: '88.0667' }
    ],
    'AP': [
      { name: 'Visakhapatnam', latitude: '17.6868', longitude: '83.2185' },
      { name: 'Vijayawada', latitude: '16.5062', longitude: '80.6480' },
      { name: 'Guntur', latitude: '16.3067', longitude: '80.4365' },
      { name: 'Nellore', latitude: '14.4426', longitude: '79.9865' },
      { name: 'Kurnool', latitude: '15.8281', longitude: '78.0373' },
      { name: 'Rajahmundry', latitude: '17.0005', longitude: '81.8040' },
      { name: 'Kadapa', latitude: '14.4673', longitude: '78.8242' },
      { name: 'Kakinada', latitude: '16.9891', longitude: '82.2475' },
      { name: 'Anantapur', latitude: '14.6819', longitude: '77.6006' },
      { name: 'Vizianagaram', latitude: '18.1124', longitude: '83.4152' },
      { name: 'Eluru', latitude: '16.7107', longitude: '81.0955' },
      { name: 'Ongole', latitude: '15.5057', longitude: '80.0499' },
      { name: 'Nandyal', latitude: '15.4774', longitude: '78.4836' },
      { name: 'Machilipatnam', latitude: '16.1871', longitude: '81.1378' }
    ],
    'TG': [
      { name: 'Hyderabad', latitude: '17.3850', longitude: '78.4867' },
      { name: 'Warangal', latitude: '17.9689', longitude: '79.5941' },
      { name: 'Nizamabad', latitude: '18.6725', longitude: '78.0941' },
      { name: 'Khammam', latitude: '17.2473', longitude: '80.1514' },
      { name: 'Karimnagar', latitude: '18.4386', longitude: '79.1288' },
      { name: 'Ramagundam', latitude: '18.4455', longitude: '79.4734' },
      { name: 'Mahbubnagar', latitude: '16.7300', longitude: '77.9910' },
      { name: 'Rangareddy', latitude: '17.3700', longitude: '78.2400' },
      { name: 'Adilabad', latitude: '19.6670', longitude: '78.5360' },
      { name: 'Suryapet', latitude: '17.1400', longitude: '79.6200' },
      { name: 'Miryalaguda', latitude: '16.8747', longitude: '79.5663' }
    ],
    'KL': [
      { name: 'Thiruvananthapuram', latitude: '8.5241', longitude: '76.9366' },
      { name: 'Kochi', latitude: '9.9312', longitude: '76.2673' },
      { name: 'Kozhikode', latitude: '11.2588', longitude: '75.7804' },
      { name: 'Thrissur', latitude: '10.5276', longitude: '76.2144' },
      { name: 'Kollam', latitude: '8.8932', longitude: '76.6141' },
      { name: 'Palakkad', latitude: '10.7867', longitude: '76.6548' },
      { name: 'Alappuzha', latitude: '9.4981', longitude: '76.3388' },
      { name: 'Malappuram', latitude: '11.0410', longitude: '76.08200' },
      { name: 'Kannur', latitude: '11.8745', longitude: '75.3704' },
      { name: 'Kasaragod', latitude: '12.4996', longitude: '74.9869' }
    ],
    'OR': [
      { name: 'Bhubaneswar', latitude: '20.2961', longitude: '85.8245' },
      { name: 'Cuttack', latitude: '20.4625', longitude: '85.8828' },
      { name: 'Rourkela', latitude: '22.2604', longitude: '84.8536' },
      { name: 'Berhampur', latitude: '19.3149', longitude: '84.7941' },
      { name: 'Sambalpur', latitude: '21.4669', longitude: '83.9812' },
      { name: 'Puri', latitude: '19.8135', longitude: '85.8312' },
      { name: 'Balasore', latitude: '21.4942', longitude: '86.9317' },
      { name: 'Bhadrak', latitude: '21.0583', longitude: '86.5083' },
      { name: 'Baripada', latitude: '21.9347', longitude: '86.7334' }
    ],
    'JH': [
      { name: 'Ranchi', latitude: '23.3441', longitude: '85.3096' },
      { name: 'Jamshedpur', latitude: '22.8046', longitude: '86.2029' },
      { name: 'Dhanbad', latitude: '23.7957', longitude: '86.4304' },
      { name: 'Bokaro', latitude: '23.6693', longitude: '86.1511' },
      { name: 'Deoghar', latitude: '24.4823', longitude: '86.6961' },
      { name: 'Phusro', latitude: '23.8030', longitude: '86.0090' },
      { name: 'Hazaribagh', latitude: '23.9981', longitude: '85.3614' },
      { name: 'Giridih', latitude: '24.1921', longitude: '86.3025' }
    ],
    'AS': [
      { name: 'Guwahati', latitude: '26.1445', longitude: '91.7362' },
      { name: 'Silchar', latitude: '24.8333', longitude: '92.7789' },
      { name: 'Dibrugarh', latitude: '27.4728', longitude: '94.9120' },
      { name: 'Jorhat', latitude: '26.7509', longitude: '94.2037' },
      { name: 'Nagaon', latitude: '26.3477', longitude: '92.6761' },
      { name: 'Tinsukia', latitude: '27.4900', longitude: '95.3597' },
      { name: 'Tezpur', latitude: '26.6336', longitude: '92.8000' }
    ],
    'BR': [
      { name: 'Patna', latitude: '25.5941', longitude: '85.1376' },
      { name: 'Gaya', latitude: '24.7955', longitude: '85.0002' },
      { name: 'Bhagalpur', latitude: '25.2425', longitude: '86.9842' },
      { name: 'Muzaffarpur', latitude: '26.1209', longitude: '85.3647' },
      { name: 'Darbhanga', latitude: '26.1542', longitude: '85.8918' },
      { name: 'Bihar Sharif', latitude: '25.2013', longitude: '85.5155' },
      { name: 'Arrah', latitude: '25.5564', longitude: '84.6638' },
      { name: 'Begusarai', latitude: '25.4176', longitude: '86.1274' },
      { name: 'Katihar', latitude: '25.5394', longitude: '87.5675' },
      { name: 'Munger', latitude: '25.3752', longitude: '86.4737' }
    ],
    'CG': [
      { name: 'Raipur', latitude: '21.2514', longitude: '81.6296' },
      { name: 'Bhilai', latitude: '21.1938', longitude: '81.3509' },
      { name: 'Korba', latitude: '22.3595', longitude: '82.7501' },
      { name: 'Bilaspur', latitude: '22.0797', longitude: '82.1409' },
      { name: 'Durg', latitude: '21.1900', longitude: '81.2849' },
      { name: 'Rajnandgaon', latitude: '21.0974', longitude: '81.0376' }
    ],
    'HR': [
      { name: 'Faridabad', latitude: '28.4089', longitude: '77.3178' },
      { name: 'Gurgaon', latitude: '28.4595', longitude: '77.0266' },
      { name: 'Panipat', latitude: '29.3909', longitude: '76.9635' },
      { name: 'Ambala', latitude: '30.3752', longitude: '76.7821' },
      { name: 'Yamunanagar', latitude: '30.1290', longitude: '77.2674' },
      { name: 'Rohtak', latitude: '28.8955', longitude: '76.6066' },
      { name: 'Hisar', latitude: '29.1492', longitude: '75.7217' },
      { name: 'Karnal', latitude: '29.6857', longitude: '76.9905' }
    ],
    'PB': [
      { name: 'Ludhiana', latitude: '30.9010', longitude: '75.8573' },
      { name: 'Amritsar', latitude: '31.6340', longitude: '74.8723' },
      { name: 'Jalandhar', latitude: '31.3260', longitude: '75.5762' },
      { name: 'Patiala', latitude: '30.3398', longitude: '76.3869' },
      { name: 'Bathinda', latitude: '30.2110', longitude: '74.9455' },
      { name: 'Mohali', latitude: '30.7046', longitude: '76.7179' },
      { name: 'Firozpur', latitude: '30.9045', longitude: '74.6066' },
      { name: 'Batala', latitude: '31.8230', longitude: '75.2045' }
    ],
    'HP': [
      { name: 'Shimla', latitude: '31.1048', longitude: '77.1734' },
      { name: 'Dharamshala', latitude: '32.2190', longitude: '76.3234' },
      { name: 'Solan', latitude: '30.9045', longitude: '77.0967' },
      { name: 'Mandi', latitude: '31.7084', longitude: '76.9319' },
      { name: 'Palampur', latitude: '32.1086', longitude: '76.5348' },
      { name: 'Baddi', latitude: '30.9576', longitude: '76.7947' }
    ],
    'UK': [
      { name: 'Dehradun', latitude: '30.3165', longitude: '78.0322' },
      { name: 'Haridwar', latitude: '29.9457', longitude: '78.1642' },
      { name: 'Roorkee', latitude: '29.8543', longitude: '77.8880' },
      { name: 'Haldwani', latitude: '29.2183', longitude: '79.5130' },
      { name: 'Rudrapur', latitude: '28.9845', longitude: '79.4070' },
      { name: 'Kashipur', latitude: '29.2155', longitude: '78.9568' }
    ],
    'JK': [
      { name: 'Srinagar', latitude: '34.0837', longitude: '74.7973' },
      { name: 'Jammu', latitude: '32.7266', longitude: '74.8570' },
      { name: 'Anantnag', latitude: '33.7311', longitude: '75.1480' },
      { name: 'Baramulla', latitude: '34.2097', longitude: '74.3436' },
      { name: 'Sopore', latitude: '34.3030', longitude: '74.4669' },
      { name: 'Kathua', latitude: '32.3704', longitude: '75.5154' }
    ],
    'DL': [
      { name: 'New Delhi', latitude: '28.6139', longitude: '77.2090' },
      { name: 'Delhi', latitude: '28.7041', longitude: '77.1025' }
    ],

    // British Cities
    'ENG': [
      { name: 'London', latitude: '51.5074', longitude: '-0.1278' },
      { name: 'Birmingham', latitude: '52.4862', longitude: '-1.8904' },
      { name: 'Manchester', latitude: '53.4808', longitude: '-2.2426' },
      { name: 'Liverpool', latitude: '53.4084', longitude: '-2.9916' },
      { name: 'Leeds', latitude: '53.8008', longitude: '-1.5491' },
      { name: 'Sheffield', latitude: '53.3811', longitude: '-1.4701' },
      { name: 'Bristol', latitude: '51.4545', longitude: '-2.5879' },
      { name: 'Newcastle', latitude: '54.9783', longitude: '-1.6178' },
      { name: 'Nottingham', latitude: '52.9548', longitude: '-1.1581' },
      { name: 'Leicester', latitude: '52.6369', longitude: '-1.1398' }
    ],
    'SCT': [
      { name: 'Edinburgh', latitude: '55.9533', longitude: '-3.1883' },
      { name: 'Glasgow', latitude: '55.8642', longitude: '-4.2518' },
      { name: 'Aberdeen', latitude: '57.1497', longitude: '-2.0943' },
      { name: 'Dundee', latitude: '56.4620', longitude: '-2.9707' },
      { name: 'Stirling', latitude: '56.1165', longitude: '-3.9369' }
    ],
    'WLS': [
      { name: 'Cardiff', latitude: '51.4816', longitude: '-3.1791' },
      { name: 'Swansea', latitude: '51.6214', longitude: '-3.9436' },
      { name: 'Newport', latitude: '51.5842', longitude: '-2.9977' },
      { name: 'Wrexham', latitude: '53.0478', longitude: '-2.9916' }
    ],
    'NIR': [
      { name: 'Belfast', latitude: '54.5973', longitude: '-5.9301' },
      { name: 'Derry', latitude: '54.9966', longitude: '-7.3086' }
    ],

    // Australian Cities
    'NSW': [
      { name: 'Sydney', latitude: '-33.8688', longitude: '151.2093' },
      { name: 'Newcastle', latitude: '-32.9283', longitude: '151.7817' },
      { name: 'Wollongong', latitude: '-34.4278', longitude: '150.8931' },
      { name: 'Central Coast', latitude: '-33.4307', longitude: '151.3428' }
    ],
    'VIC': [
      { name: 'Melbourne', latitude: '-37.8136', longitude: '144.9631' },
      { name: 'Geelong', latitude: '-38.1499', longitude: '144.3617' },
      { name: 'Ballarat', latitude: '-37.5622', longitude: '143.8503' },
      { name: 'Bendigo', latitude: '-36.7570', longitude: '144.2794' }
    ],
    'QLD': [
      { name: 'Brisbane', latitude: '-27.4698', longitude: '153.0251' },
      { name: 'Gold Coast', latitude: '-28.0167', longitude: '153.4000' },
      { name: 'Townsville', latitude: '-19.2590', longitude: '146.8169' },
      { name: 'Cairns', latitude: '-16.9186', longitude: '145.7781' }
    ],
    'SA': [
      { name: 'Adelaide', latitude: '-34.9285', longitude: '138.6007' },
      { name: 'Mount Gambier', latitude: '-37.8282', longitude: '140.7832' }
    ],
    'WA': [
      { name: 'Perth', latitude: '-31.9505', longitude: '115.8605' },
      { name: 'Fremantle', latitude: '-32.0569', longitude: '115.7439' }
    ],
    'TAS': [
      { name: 'Hobart', latitude: '-42.8821', longitude: '147.3272' },
      { name: 'Launceston', latitude: '-41.4332', longitude: '147.1441' }
    ],
    'NT': [
      { name: 'Darwin', latitude: '-12.4634', longitude: '130.8456' },
      { name: 'Alice Springs', latitude: '-23.6980', longitude: '133.8807' }
    ],
    'ACT': [
      { name: 'Canberra', latitude: '-35.2809', longitude: '149.1300' }
    ],

    // German Cities
    'BW': [
      { name: 'Stuttgart', latitude: '48.7758', longitude: '9.1829' },
      { name: 'Mannheim', latitude: '49.4875', longitude: '8.4660' },
      { name: 'Karlsruhe', latitude: '49.0069', longitude: '8.4037' },
      { name: 'Freiburg', latitude: '47.9990', longitude: '7.8421' }
    ],
    'BY': [
      { name: 'Munich', latitude: '48.1351', longitude: '11.5820' },
      { name: 'Nuremberg', latitude: '49.4521', longitude: '11.0767' },
      { name: 'Augsburg', latitude: '48.3705', longitude: '10.8978' },
      { name: 'Regensburg', latitude: '49.0134', longitude: '12.1016' }
    ],
    'BE': [
      { name: 'Berlin', latitude: '52.5200', longitude: '13.4050' }
    ],
    'HH': [
      { name: 'Hamburg', latitude: '53.5511', longitude: '9.9937' }
    ],
    'NW': [
      { name: 'Cologne', latitude: '50.9375', longitude: '6.9603' },
      { name: 'Düsseldorf', latitude: '51.2277', longitude: '6.7735' },
      { name: 'Dortmund', latitude: '51.5136', longitude: '7.4653' },
      { name: 'Essen', latitude: '51.4556', longitude: '7.0116' }
    ],

    // Chinese Cities
    'BJ': [
      { name: 'Beijing', latitude: '39.9042', longitude: '116.4074' }
    ],
    'SH': [
      { name: 'Shanghai', latitude: '31.2304', longitude: '121.4737' }
    ],
    'GD': [
      { name: 'Guangzhou', latitude: '23.1291', longitude: '113.2644' },
      { name: 'Shenzhen', latitude: '22.3193', longitude: '114.1694' },
      { name: 'Dongguan', latitude: '23.0489', longitude: '113.7447' },
      { name: 'Foshan', latitude: '23.0301', longitude: '113.1221' }
    ],
    'ZJ': [
      { name: 'Hangzhou', latitude: '30.2741', longitude: '120.1551' },
      { name: 'Ningbo', latitude: '29.8683', longitude: '121.5440' },
      { name: 'Wenzhou', latitude: '27.9941', longitude: '120.6994' }
    ],
    'JS': [
      { name: 'Nanjing', latitude: '32.0603', longitude: '118.7969' },
      { name: 'Suzhou', latitude: '31.2989', longitude: '120.5853' },
      { name: 'Wuxi', latitude: '31.4912', longitude: '120.3124' }
    ],

    // Brazilian Cities
    'SP': [
      { name: 'São Paulo', latitude: '-23.5505', longitude: '-46.6333' },
      { name: 'Campinas', latitude: '-22.9099', longitude: '-47.0626' },
      { name: 'São Bernardo do Campo', latitude: '-23.6914', longitude: '-46.5646' },
      { name: 'Santo André', latitude: '-23.6739', longitude: '-46.5391' }
    ],
    'RJ': [
      { name: 'Rio de Janeiro', latitude: '-22.9068', longitude: '-43.1729' },
      { name: 'Niterói', latitude: '-22.8833', longitude: '-43.1036' },
      { name: 'Nova Iguaçu', latitude: '-22.7591', longitude: '-43.4509' }
    ],
    'MG': [
      { name: 'Belo Horizonte', latitude: '-19.8157', longitude: '-43.9542' },
      { name: 'Uberlândia', latitude: '-18.9113', longitude: '-48.2622' },
      { name: 'Contagem', latitude: '-19.9167', longitude: '-44.0833' }
    ],
    'RS': [
      { name: 'Porto Alegre', latitude: '-30.0346', longitude: '-51.2177' },
      { name: 'Caxias do Sul', latitude: '-29.1678', longitude: '-51.1794' },
      { name: 'Pelotas', latitude: '-31.7654', longitude: '-52.3376' }
    ],
    'PR': [
      { name: 'Curitiba', latitude: '-25.4284', longitude: '-49.2733' },
      { name: 'Londrina', latitude: '-23.3045', longitude: '-51.1696' },
      { name: 'Maringá', latitude: '-23.4205', longitude: '-51.9331' }
    ],

    // Japanese Cities
    'TKY': [
      { name: 'Tokyo', latitude: '35.6762', longitude: '139.6503' },
      { name: 'Shibuya', latitude: '35.6596', longitude: '139.7006' },
      { name: 'Shinjuku', latitude: '35.6938', longitude: '139.7034' },
      { name: 'Harajuku', latitude: '35.6702', longitude: '139.7027' }
    ],
    'OSK': [
      { name: 'Osaka', latitude: '34.6937', longitude: '135.5023' },
      { name: 'Sakai', latitude: '34.5732', longitude: '135.4827' },
      { name: 'Higashiosaka', latitude: '34.6780', longitude: '135.6007' }
    ],
    'KNG': [
      { name: 'Yokohama', latitude: '35.4437', longitude: '139.6380' },
      { name: 'Kawasaki', latitude: '35.5206', longitude: '139.7172' },
      { name: 'Sagamihara', latitude: '35.5761', longitude: '139.3708' }
    ],
    'AIC': [
      { name: 'Nagoya', latitude: '35.1815', longitude: '136.9066' },
      { name: 'Toyota', latitude: '35.0828', longitude: '137.1549' },
      { name: 'Okazaki', latitude: '34.9550', longitude: '137.1748' }
    ],
    'HOK': [
      { name: 'Sapporo', latitude: '43.0642', longitude: '141.3469' },
      { name: 'Hakodate', latitude: '41.7687', longitude: '140.7288' },
      { name: 'Asahikawa', latitude: '43.7706', longitude: '142.3656' }
    ],
    'FKO': [
      { name: 'Fukuoka', latitude: '33.5904', longitude: '130.4017' },
      { name: 'Kitakyushu', latitude: '33.8834', longitude: '130.8751' },
      { name: 'Kurume', latitude: '33.3197', longitude: '130.5089' }
    ],

    // French Cities
    'IDF': [
      { name: 'Paris', latitude: '48.8566', longitude: '2.3522' },
      { name: 'Boulogne-Billancourt', latitude: '48.8336', longitude: '2.2401' },
      { name: 'Saint-Denis', latitude: '48.9362', longitude: '2.3574' },
      { name: 'Argenteuil', latitude: '48.9474', longitude: '2.2473' }
    ],
    'ARA': [
      { name: 'Lyon', latitude: '45.7640', longitude: '4.8357' },
      { name: 'Saint-Étienne', latitude: '45.4397', longitude: '4.3872' },
      { name: 'Grenoble', latitude: '45.1885', longitude: '5.7245' },
      { name: 'Villeurbanne', latitude: '45.7665', longitude: '4.8795' }
    ],
    'PAC': [
      { name: 'Marseille', latitude: '43.2965', longitude: '5.3698' },
      { name: 'Nice', latitude: '43.7102', longitude: '7.2620' },
      { name: 'Toulon', latitude: '43.1242', longitude: '5.9280' },
      { name: 'Aix-en-Provence', latitude: '43.5297', longitude: '5.4474' }
    ],
    'OCC': [
      { name: 'Toulouse', latitude: '43.6047', longitude: '1.4442' },
      { name: 'Montpellier', latitude: '43.6108', longitude: '3.8767' },
      { name: 'Nîmes', latitude: '43.8367', longitude: '4.3601' },
      { name: 'Perpignan', latitude: '42.6886', longitude: '2.8948' }
    ],
    'HDF': [
      { name: 'Lille', latitude: '50.6292', longitude: '3.0573' },
      { name: 'Amiens', latitude: '49.8941', longitude: '2.2957' },
      { name: 'Roubaix', latitude: '50.6942', longitude: '3.1746' },
      { name: 'Tourcoing', latitude: '50.7236', longitude: '3.1614' }
    ],

    // Italian Cities
    'LOM': [
      { name: 'Milan', latitude: '45.4642', longitude: '9.1900' },
      { name: 'Bergamo', latitude: '45.6983', longitude: '9.6773' },
      { name: 'Brescia', latitude: '45.5416', longitude: '10.2118' },
      { name: 'Monza', latitude: '45.5845', longitude: '9.2744' }
    ],
    'LAZ': [
      { name: 'Rome', latitude: '41.9028', longitude: '12.4964' }
    ],
    'CAM': [
      { name: 'Naples', latitude: '40.8518', longitude: '14.2681' },
      { name: 'Salerno', latitude: '40.6824', longitude: '14.7681' }
    ],
    'SIC': [
      { name: 'Palermo', latitude: '38.1157', longitude: '13.3613' },
      { name: 'Catania', latitude: '37.5079', longitude: '15.0830' },
      { name: 'Messina', latitude: '38.1938', longitude: '15.5540' }
    ],
    'PUG': [
      { name: 'Bari', latitude: '41.1171', longitude: '16.8719' },
      { name: 'Taranto', latitude: '40.4668', longitude: '17.2725' },
      { name: 'Foggia', latitude: '41.4621', longitude: '15.5444' }
    ],
    'VEN': [
      { name: 'Venice', latitude: '45.4408', longitude: '12.3155' },
      { name: 'Verona', latitude: '45.4384', longitude: '10.9916' },
      { name: 'Padua', latitude: '45.4064', longitude: '11.8768' }
    ],
    'TOS': [
      { name: 'Florence', latitude: '43.7696', longitude: '11.2558' },
      { name: 'Pisa', latitude: '43.7228', longitude: '10.4017' },
      { name: 'Livorno', latitude: '43.5482', longitude: '10.3116' }
    ],

    // Spanish Cities
    'MD': [
      { name: 'Madrid', latitude: '40.4168', longitude: '-3.7038' }
    ],
    'CT': [
      { name: 'Barcelona', latitude: '41.3851', longitude: '2.1734' },
      { name: 'Hospitalet de Llobregat', latitude: '41.3598', longitude: '2.1006' },
      { name: 'Badalona', latitude: '41.4502', longitude: '2.2470' }
    ],
    'VC': [
      { name: 'Valencia', latitude: '39.4699', longitude: '-0.3763' },
      { name: 'Alicante', latitude: '38.3452', longitude: '-0.4810' },
      { name: 'Castellón', latitude: '39.9864', longitude: '-0.0513' }
    ],
    'AN': [
      { name: 'Seville', latitude: '37.3891', longitude: '-5.9845' },
      { name: 'Málaga', latitude: '36.7213', longitude: '-4.4214' },
      { name: 'Córdoba', latitude: '37.8882', longitude: '-4.7794' },
      { name: 'Granada', latitude: '37.1773', longitude: '-3.5986' }
    ],
    'PV': [
      { name: 'Bilbao', latitude: '43.2627', longitude: '-2.9253' },
      { name: 'Vitoria-Gasteiz', latitude: '42.8467', longitude: '-2.6716' },
      { name: 'San Sebastián', latitude: '43.3183', longitude: '-1.9812' }
    ],

    // Mexican Cities
    'DF': [
      { name: 'Mexico City', latitude: '19.4326', longitude: '-99.1332' }
    ],
    'JA': [
      { name: 'Guadalajara', latitude: '20.6597', longitude: '-103.3496' },
      { name: 'Zapopan', latitude: '20.7227', longitude: '-103.3844' },
      { name: 'Tlaquepaque', latitude: '20.6401', longitude: '-103.2893' }
    ],
    'NL': [
      { name: 'Monterrey', latitude: '25.6866', longitude: '-100.3161' },
      { name: 'Guadalupe', latitude: '25.6767', longitude: '-100.2593' },
      { name: 'San Nicolás de los Garza', latitude: '25.7487', longitude: '-100.2960' }
    ],
    'PU': [
      { name: 'Puebla', latitude: '19.0414', longitude: '-98.2063' },
      { name: 'Tehuacán', latitude: '18.4622', longitude: '-97.3958' }
    ],
    'BC_MX': [
      { name: 'Tijuana', latitude: '32.5027', longitude: '-117.0039' },
      { name: 'Mexicali', latitude: '32.6519', longitude: '-115.4681' },
      { name: 'Ensenada', latitude: '31.8665', longitude: '-116.5956' }
    ],

    // Russian Cities
    'MOW': [
      { name: 'Moscow', latitude: '55.7558', longitude: '37.6176' }
    ],
    'SPE': [
      { name: 'Saint Petersburg', latitude: '59.9311', longitude: '30.3609' }
    ],
    'NVS': [
      { name: 'Novosibirsk', latitude: '55.0084', longitude: '82.9357' }
    ],
    'SVE': [
      { name: 'Yekaterinburg', latitude: '56.8431', longitude: '60.6454' }
    ],
    'NIZ': [
      { name: 'Nizhny Novgorod', latitude: '56.2965', longitude: '43.9361' }
    ],
    'SAM': [
      { name: 'Samara', latitude: '53.2001', longitude: '50.1500' }
    ],
    'OMS': [
      { name: 'Omsk', latitude: '54.9885', longitude: '73.3242' }
    ],
    'KGD': [
      { name: 'Kaliningrad', latitude: '54.7104', longitude: '20.4522' }
    ],
    'CHE': [
      { name: 'Chelyabinsk', latitude: '55.1644', longitude: '61.4368' }
    ],
    'ROS': [
      { name: 'Rostov-on-Don', latitude: '47.2357', longitude: '39.7015' }
    ]
  };

  // Check if user came from projects page
  useEffect(() => {
    const fromProjectsPage = location.state?.fromProjects;
    if (!fromProjectsPage) {
      navigate('/projects', { replace: true });
    }
  }, [location.state, navigate]);

  // Fetch countries on component mount
  useEffect(() => {
    fetchCountries();
  }, []);

  // Fetch states when country changes
  useEffect(() => {
    if (selectedCountryCode) {
      fetchStates(selectedCountryCode);
      setFormData(prev => ({ ...prev, state: '', city: '' }));
      setStates([]);
      setCities([]);
      setSelectedStateCode('');
    }
  }, [selectedCountryCode]);

  // Fetch cities when state changes
  useEffect(() => {
    if (selectedCountryCode && selectedStateCode) {
      fetchCities(selectedCountryCode, selectedStateCode);
      setFormData(prev => ({ ...prev, city: '' }));
    }
  }, [selectedStateCode]);

  // Update map when location changes
  useEffect(() => {
    updateMapLocation();
  }, [formData.country, formData.state, formData.city, countries]);

  const fetchCountries = async () => {
    try {
      const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,latlng');
      const data = await response.json();
      const sortedCountries = data.sort((a: Country, b: Country) =>
        a.name.common.localeCompare(b.name.common)
      );
      setCountries(sortedCountries);
    } catch (error) {
      console.error('Error fetching countries:', error);
    }
  };

  const fetchStates = async (countryCode: string) => {
    try {
      setStates(allStatesData[countryCode] || []);
    } catch (error) {
      console.error('Error fetching states:', error);
    }
  };

  const fetchCities = async (countryCode: string, stateCode: string) => {
    setCities(allCitiesData[stateCode] || []);
  };

  // Function to determine zoom level based on what's selected
  const getZoomLevel = (): number => {
    if (formData.city && formData.state && formData.country) {
      return 0.2; // Most zoomed in for cities
    } else if (formData.state && formData.country) {
      return 1.0; // Medium zoom for states
    } else if (formData.country) {
      return 5.0; // Least zoomed (wide view) for countries
    } else {
      return 3.0; // Default zoom
    }
  };

  // Fuzzy matching function for better location detection
  const fuzzyMatch = (input: string, target: string): boolean => {
    if (!input || !target) return false;

    const inputLower = input.toLowerCase().trim();
    const targetLower = target.toLowerCase().trim();

    // Exact match
    if (inputLower === targetLower) return true;

    // Check if input is contained in target or vice versa (minimum 3 characters)
    if (inputLower.length >= 3 && targetLower.includes(inputLower)) return true;
    if (targetLower.length >= 3 && inputLower.includes(targetLower)) return true;

    // Check common misspellings and variations
    const variations: { [key: string]: string[] } = {
      'gujarat': ['gujrat', 'gujrath', 'gujarath'],
      'maharashtra': ['maharastra', 'maharashtr'],
      'karnataka': ['karnatak', 'karnata'],
      'california': ['califonia', 'califronia'],
      'new york': ['newyork', 'ny'],
      'mumbai': ['bombay'],
      'bangalore': ['bengaluru'],
      'chennai': ['madras'],
      'kolkata': ['calcutta'],
      'jharkhand': ['jharkand', 'jarkhand'],
      'chhattisgarh': ['chattisgarh', 'chhatisgarh'],
      'odisha': ['orissa', 'odhisa'],
      'uttarakhand': ['uttaranchal'],
      'telangana': ['telengana'],
      'himachal pradesh': ['himachal', 'hp'],
      'andhra pradesh': ['andhra', 'ap'],
      'uttar pradesh': ['up'],
      'madhya pradesh': ['mp'],
      'west bengal': ['wb', 'bengal'],
      'tamil nadu': ['tn', 'tamilnadu'],
      'jammu and kashmir': ['j&k', 'jk', 'kashmir']
    };

    // Check if input matches any variation of the target
    const targetVariations = variations[targetLower] || [];
    if (targetVariations.includes(inputLower)) return true;

    // Check if target matches any variation of the input
    const inputVariations = variations[inputLower] || [];
    if (inputVariations.includes(targetLower)) return true;

    // Check for partial matches at the beginning (for typing as you go)
    if (inputLower.length >= 3 && targetLower.startsWith(inputLower)) return true;

    return false;
  };

  const updateMapLocation = () => {
    // Priority: City > State > Country

    // Check for city first
    if (formData.city && formData.country && selectedCountryCode) {
      // Get all cities for the selected country's states
      const countryStates = allStatesData[selectedCountryCode] || [];
      for (const state of countryStates) {
        const stateCities = allCitiesData[state.iso2] || [];
        const selectedCity = stateCities.find(c =>
          fuzzyMatch(formData.city, c.name)
        );
        if (selectedCity && selectedCity.latitude && selectedCity.longitude) {
          setMapCenter({
            lat: parseFloat(selectedCity.latitude),
            lng: parseFloat(selectedCity.longitude)
          });
          return;
        }
      }
    }

    // Check for state
    if (formData.state && formData.country && selectedCountryCode) {
      const countryStates = allStatesData[selectedCountryCode] || [];
      const selectedState = countryStates.find(s =>
        fuzzyMatch(formData.state, s.name)
      );
      if (selectedState && selectedState.latitude && selectedState.longitude) {
        setMapCenter({
          lat: parseFloat(selectedState.latitude),
          lng: parseFloat(selectedState.longitude)
        });
        return;
      }
    }

    // Finally check for country with custom coordinates
    if (formData.country && countries.length > 0) {
      // Use custom coordinates for better country centers
      const customCountryCoords: { [key: string]: [number, number] } = {
        'India': [20.5937, 78.9629], // Center of India (more zoomed out)
        'United States': [39.8283, -98.5795], // Center of US
        'Canada': [56.1304, -106.3468], // Center of Canada
        'United Kingdom': [55.3781, -3.4360], // Center of UK
        'Australia': [-25.2744, 133.7751], // Center of Australia
        'China': [35.8617, 104.1954], // Center of China
        'Brazil': [-14.2350, -51.9253], // Center of Brazil
        'Germany': [51.1657, 10.4515], // Center of Germany
        'France': [46.2276, 2.2137], // Center of France
        'Japan': [36.2048, 138.2529], // Center of Japan
      };

      // Check if we have custom coordinates for this country
      if (customCountryCoords[formData.country]) {
        const coords = customCountryCoords[formData.country];
        setMapCenter({ lat: coords[0], lng: coords[1] });
        return;
      }

      // Fallback to API coordinates
      const selectedCountry = countries.find(c =>
        fuzzyMatch(formData.country, c.name.common)
      );
      if (selectedCountry && selectedCountry.latlng && selectedCountry.latlng.length >= 2) {
        setMapCenter({ lat: selectedCountry.latlng[0], lng: selectedCountry.latlng[1] });
      }
    }
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.project_name.trim()) {
      errors.project_name = 'Project name is required';
    }

    if (!formData.address_line_1.trim()) {
      errors.address_line_1 = 'Address line 1 is required';
    }

    if (!formData.country.trim()) {
      errors.country = 'Country is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Handle country selection
    if (name === 'country') {
      const selectedCountry = countries.find(c => c.name.common === value);
      if (selectedCountry) {
        setSelectedCountryCode(selectedCountry.cca2);
      }
    }

    // Handle state selection - FIXED with fuzzy matching
    if (name === 'state' && selectedCountryCode) {
      const countryStates = allStatesData[selectedCountryCode] || [];
      const selectedState = countryStates.find(s =>
        fuzzyMatch(value, s.name)
      );
      if (selectedState) {
        setSelectedStateCode(selectedState.iso2);
      }
    }

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleBudgetChange = (increment: boolean) => {
    const currentBudget = parseFloat(formData.estimated_budget) || 0;
    const step = 1000;
    const newBudget = increment
      ? currentBudget + step
      : Math.max(0, currentBudget - step);

    setFormData(prev => ({
      ...prev,
      estimated_budget: newBudget.toString()
    }));
  };

  const handleBack = () => {
    navigate('/projects');
  };

  const handleCreateProject = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');

      if (!token) {
        setError('Please login to create a project');
        navigate('/login');
        return;
      }

      // Prepare the data for API
      const apiData = {
        project_name: formData.project_name.trim(),
        address_line_1: formData.address_line_1.trim(),
        address_line_2: formData.address_line_2.trim() || undefined,
        address_line_3: formData.address_line_3.trim() || undefined,
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
        country: formData.country.trim(),
        pincode: formData.pincode.trim() || undefined,
        estimated_budget: parseFloat(formData.estimated_budget) || 0,
        currency: formData.currency,
        additional_details: formData.additional_details.trim() || undefined
      };

      const response = await fetch(`${API_BASE_URL}/projects/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData)
      });

      if (response.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.removeItem('access_token');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const createdProject: ApiResponse = await response.json();

      // Update localStorage with new project
      const cachedProjects = localStorage.getItem("userProjects");
      const currentProjects = cachedProjects ? JSON.parse(cachedProjects) : [];
      const updatedProjects = [createdProject, ...currentProjects];
      localStorage.setItem("userProjects", JSON.stringify(updatedProjects));

      // Show success message briefly
      setError(null);

      // Navigate to the project's plans page with the created project data
      navigate(`/projects/${createdProject.id}/plans`, {
        state: {
          fromNewProject: true,
          projectData: createdProject,
          showSuccessMessage: true
        }
      });

    } catch (err) {
      console.error('Error creating project:', err);
      setError(err instanceof Error ? err.message : 'Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currencies = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'INR', label: 'INR - Indian Rupee' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'JPY', label: 'JPY - Japanese Yen' },
    { value: 'AUD', label: 'AUD - Australian Dollar' },
    { value: 'CAD', label: 'CAD - Canadian Dollar' }
  ];

  return (
    <div className="new-project-wrapper">
      <div className="new-project-header">
        <h1 className="new-project-main-title">Create New Project</h1>
        <p className="new-project-subtitle">
          This information will help us propose the best options for your project
        </p>
      </div>

      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
          <button
            className="error-close"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}

      <div className="new-project-container">
        <div className="project-form-card">
          {/* Form Section - Left Half */}
          <div className="form-section">
            <div className="new-project-form-section">
              <label className="new-project-label">
                Project Name <span className="required">*</span>
              </label>
              <input
                type="text"
                name="project_name"
                value={formData.project_name}
                onChange={handleInputChange}
                className={`new-project-input ${validationErrors.project_name ? 'error' : ''}`}
                placeholder="Enter project name"
                disabled={loading}
              />
              {validationErrors.project_name && (
                <span className="validation-error">{validationErrors.project_name}</span>
              )}
            </div>

            <div className="new-project-form-section">
              <label className="new-project-label">
                Address <span className="required">*</span>
              </label>
              <input
                type="text"
                name="address_line_1"
                value={formData.address_line_1}
                onChange={handleInputChange}
                className={`new-project-input ${validationErrors.address_line_1 ? 'error' : ''}`}
                placeholder="Address line 1*"
                disabled={loading}
              />
              {validationErrors.address_line_1 && (
                <span className="validation-error">{validationErrors.address_line_1}</span>
              )}

              <input
                type="text"
                name="address_line_2"
                value={formData.address_line_2}
                onChange={handleInputChange}
                className="new-project-input"
                placeholder="Address Line 2 (Optional)"
                disabled={loading}
              />

              <input
                type="text"
                name="address_line_3"
                value={formData.address_line_3}
                onChange={handleInputChange}
                className="new-project-input"
                placeholder="Address Line 3 (Optional)"
                disabled={loading}
              />
            </div>

            <div className="new-project-form-row">
              <div className="input-group">
                <label className="new-project-label">Country <span className="required">*</span></label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className={`new-project-select ${validationErrors.country ? 'error' : ''}`}
                  disabled={loading}
                >
                  <option value="">Select Country</option>
                  {countries.map((country) => (
                    <option key={country.cca2} value={country.name.common}>
                      {country.name.common}
                    </option>
                  ))}
                </select>
                {validationErrors.country && (
                  <span className="validation-error">{validationErrors.country}</span>
                )}
              </div>

              <div className="input-group">
                <label className="new-project-label">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="new-project-input"
                  placeholder="Enter State"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="new-project-form-row">
              <div className="input-group">
                <label className="new-project-label">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="new-project-input"
                  placeholder="Enter City"
                  disabled={loading}
                />
              </div>

              <div className="input-group">
                <label className="new-project-label">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  className="new-project-input"
                  placeholder="Pincode (Optional)"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="new-project-form-row">
              <div className="input-group">
                <label className="new-project-label">Estimated Budget</label>
                <div className="new-project-budget-input-wrapper">
                  <input
                    type="number"
                    name="estimated_budget"
                    value={formData.estimated_budget}
                    onChange={handleInputChange}
                    className="new-project-input new-project-budget-input"
                    min="0"
                    step="1000"
                    disabled={loading}
                    placeholder="Enter budget (Optional)"
                  />
                  <div className="new-project-budget-arrows">
                    <button
                      type="button"
                      className="new-project-arrow-btn"
                      onClick={() => handleBudgetChange(true)}
                      disabled={loading}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      className="new-project-arrow-btn"
                      onClick={() => handleBudgetChange(false)}
                      disabled={loading}
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label className="new-project-label">Currency</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="new-project-select"
                  disabled={loading}
                >
                  {currencies.map((currency) => (
                    <option key={currency.value} value={currency.value}>
                      {currency.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

          </div>

          {/* Map Section - Right Half */}
          <div className="map-section">
            <div className="map-container">
              <iframe
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapCenter.lng - getZoomLevel()}%2C${mapCenter.lat - getZoomLevel()}%2C${mapCenter.lng + getZoomLevel()}%2C${mapCenter.lat + getZoomLevel()}&layer=mapnik&marker=${mapCenter.lat}%2C${mapCenter.lng}`}
                width="100%"
                height="400"
                style={{ border: 0, borderRadius: '12px' }}
                title="Project Location Map"
              />
              {!formData.country && (
                <div className="map-placeholder">
                  <div className="map-placeholder-content">
                    <span className="map-icon">🗺️</span>
                    <p>Select a location to view on map</p>
                  </div>
                </div>
              )}
            </div>
            <div className="new-project-form-section">
              <label className="new-project-label">Additional Details</label>
              <textarea
                name="additional_details"
                value={formData.additional_details}
                onChange={handleInputChange}
                className="new-project-textarea"
                placeholder="Additional Details (Optional)"
                rows={4}
                disabled={loading}

              />
            </div>

            <div className="new-project-actions" style={{ position: "relative", top: "10px" }}>
              <button
                type="button"
                onClick={handleBack}
                className="new-project-back-btn"
                disabled={loading}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleCreateProject}
                className="new-project-create-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Creating...
                  </>
                ) : (
                  'Create Project'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewProject;