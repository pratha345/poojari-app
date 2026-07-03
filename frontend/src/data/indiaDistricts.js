// India States & Districts
// Maharashtra: full data with lat/lon (pre-loaded, no API call needed)
// All other states: English names only — lat/lon fetched via Nominatim on selection

const eng = (...names) => names.map(en => ({ name: en, en }));

export const INDIA_STATES = [
  // ── 1. Maharashtra (default, full lat/lon) ───────────────────────
  {
    state: 'महाराष्ट्र', stateEn: 'Maharashtra',
    districts: [
      { name: 'अहमदनगर',                 en: 'Ahmednagar',          lat: 19.0948, lon: 74.7480 },
      { name: 'अकोला',                    en: 'Akola',               lat: 20.7002, lon: 77.0082 },
      { name: 'अमरावती',                  en: 'Amravati',            lat: 20.9333, lon: 77.7500 },
      { name: 'औरंगाबाद (छ.संभाजीनगर)', en: 'Aurangabad',          lat: 19.8762, lon: 75.3433 },
      { name: 'बीड',                      en: 'Beed',                lat: 18.9890, lon: 75.7601 },
      { name: 'भंडारा',                   en: 'Bhandara',            lat: 21.1667, lon: 79.6500 },
      { name: 'बुलढाणा',                  en: 'Buldhana',            lat: 20.5330, lon: 76.1840 },
      { name: 'चंद्रपूर',                 en: 'Chandrapur',          lat: 19.9615, lon: 79.2961 },
      { name: 'धुळे',                     en: 'Dhule',               lat: 20.9026, lon: 74.7749 },
      { name: 'धाराशिव (उस्मानाबाद)',     en: 'Dharashiv',           lat: 18.1868, lon: 76.0388 },
      { name: 'गडचिरोली',                 en: 'Gadchiroli',          lat: 20.1809, lon: 80.0000 },
      { name: 'गोंदिया',                  en: 'Gondia',              lat: 21.4600, lon: 80.1900 },
      { name: 'हिंगोली',                  en: 'Hingoli',             lat: 19.7189, lon: 77.1497 },
      { name: 'जळगाव',                    en: 'Jalgaon',             lat: 21.0077, lon: 75.5626 },
      { name: 'जालना',                    en: 'Jalna',               lat: 19.8345, lon: 75.8847 },
      { name: 'कोल्हापूर',                en: 'Kolhapur',            lat: 16.6975, lon: 74.2282 },
      { name: 'लातूर',                    en: 'Latur',               lat: 18.4088, lon: 76.5604 },
      { name: 'मुंबई शहर',                en: 'Mumbai City',         lat: 18.9667, lon: 72.8333 },
      { name: 'मुंबई उपनगर',              en: 'Mumbai Suburban',     lat: 19.0760, lon: 72.8777 },
      { name: 'नागपूर',                   en: 'Nagpur',              lat: 21.1458, lon: 79.0882 },
      { name: 'नांदेड',                   en: 'Nanded',              lat: 19.1383, lon: 77.2933 },
      { name: 'नंदुरबार',                 en: 'Nandurbar',           lat: 21.3667, lon: 74.2333 },
      { name: 'नाशिक',                    en: 'Nashik',              lat: 20.0059, lon: 73.7898 },
      { name: 'पालघर',                    en: 'Palghar',             lat: 19.6969, lon: 72.7650 },
      { name: 'परभणी',                    en: 'Parbhani',            lat: 19.2618, lon: 76.5748 },
      { name: 'पुणे',                     en: 'Pune',                lat: 18.5204, lon: 73.8567 },
      { name: 'रायगड',                    en: 'Raigad',              lat: 18.5158, lon: 73.1820 },
      { name: 'रत्नागिरी',                en: 'Ratnagiri',           lat: 16.9940, lon: 73.3120 },
      { name: 'सांगली',                   en: 'Sangli',              lat: 16.8524, lon: 74.5815 },
      { name: 'सातारा',                   en: 'Satara',              lat: 17.6805, lon: 73.9853 },
      { name: 'सिंधुदुर्ग',               en: 'Sindhudurg',          lat: 16.0496, lon: 73.9724 },
      { name: 'सोलापूर',                  en: 'Solapur',             lat: 17.6805, lon: 75.9064 },
      { name: 'ठाणे',                     en: 'Thane',               lat: 19.2183, lon: 72.9781 },
      { name: 'वर्धा',                    en: 'Wardha',              lat: 20.7469, lon: 78.6022 },
      { name: 'वाशिम',                    en: 'Washim',              lat: 20.1115, lon: 77.1333 },
      { name: 'यवतमाळ',                   en: 'Yavatmal',            lat: 20.3977, lon: 78.1209 },
    ]
  },

  // ── 2. Andhra Pradesh ────────────────────────────────────────────
  { state: 'आंध्र प्रदेश', stateEn: 'Andhra Pradesh', districts: eng(
    'Alluri Sitharama Raju','Anakapalli','Anantapur','Annamayya','Bapatla',
    'Chittoor','East Godavari','Eluru','Guntur','Kakinada','Konaseema',
    'Krishna','Kurnool','Nandyal','NTR','Palnadu','Prakasam',
    'Sri Balaji','Sri Satya Sai','Srikakulam','Tirupati','Visakhapatnam',
    'Vizianagaram','West Godavari','YSR Kadapa'
  )},

  // ── 3. Arunachal Pradesh ─────────────────────────────────────────
  { state: 'अरुणाचल प्रदेश', stateEn: 'Arunachal Pradesh', districts: eng(
    'Anjaw','Changlang','Dibang Valley','East Kameng','East Siang',
    'Kamle','Kra Daadi','Kurung Kumey','Lepa Rada','Lohit','Longding',
    'Lower Dibang Valley','Lower Siang','Lower Subansiri','Namsai',
    'Pakke-Kessang','Papum Pare','Shi Yomi','Siang','Tawang','Tirap',
    'Upper Siang','Upper Subansiri','West Kameng','West Siang'
  )},

  // ── 4. Assam ─────────────────────────────────────────────────────
  { state: 'आसाम', stateEn: 'Assam', districts: eng(
    'Bajali','Baksa','Barpeta','Biswanath','Bongaigaon','Cachar',
    'Charaideo','Chirang','Darrang','Dhemaji','Dhubri','Dibrugarh',
    'Dima Hasao','Goalpara','Golaghat','Hailakandi','Hojai','Jorhat',
    'Kamrup Metropolitan','Kamrup Rural','Karbi Anglong','Karimganj',
    'Kokrajhar','Lakhimpur','Majuli','Morigaon','Nagaon','Nalbari',
    'Sivasagar','Sonitpur','South Salmara-Mankachar','Tamulpur',
    'Tinsukia','Udalguri','West Karbi Anglong'
  )},

  // ── 5. Bihar ─────────────────────────────────────────────────────
  { state: 'बिहार', stateEn: 'Bihar', districts: eng(
    'Araria','Arwal','Aurangabad','Banka','Begusarai','Bhagalpur',
    'Bhojpur','Buxar','Darbhanga','East Champaran','Gaya','Gopalganj',
    'Jamui','Jehanabad','Kaimur','Katihar','Khagaria','Kishanganj',
    'Lakhisarai','Madhepura','Madhubani','Munger','Muzaffarpur',
    'Nalanda','Nawada','Patna','Purnia','Rohtas','Saharsa',
    'Samastipur','Saran','Sheikhpura','Sheohar','Sitamarhi',
    'Siwan','Supaul','Vaishali','West Champaran'
  )},

  // ── 6. Chhattisgarh ──────────────────────────────────────────────
  { state: 'छत्तीसगड', stateEn: 'Chhattisgarh', districts: eng(
    'Balod','Baloda Bazar','Balrampur','Bastar','Bemetara','Bijapur',
    'Bilaspur','Dantewada','Dhamtari','Durg','Gariaband',
    'Gaurela-Pendra-Marwahi','Janjgir-Champa','Jashpur','Kabirdham',
    'Kanker','Khairagarh','Kondagaon','Korba','Koriya','Mahasamund',
    'Manendragarh','Mohla-Manpur','Mungeli','Narayanpur','Raigarh',
    'Raipur','Rajnandgaon','Sakti','Sarangarh-Bilaigarh',
    'Sukma','Surajpur','Surguja'
  )},

  // ── 7. Goa ───────────────────────────────────────────────────────
  { state: 'गोवा', stateEn: 'Goa', districts: eng('North Goa','South Goa') },

  // ── 8. Gujarat ───────────────────────────────────────────────────
  { state: 'गुजरात', stateEn: 'Gujarat', districts: eng(
    'Ahmedabad','Amreli','Anand','Aravalli','Banaskantha','Bharuch',
    'Bhavnagar','Botad','Chhota Udaipur','Dahod','Dang',
    'Devbhoomi Dwarka','Gandhinagar','Gir Somnath','Jamnagar',
    'Junagadh','Kheda','Kutch','Mahisagar','Mehsana','Morbi',
    'Narmada','Navsari','Panchmahal','Patan','Porbandar','Rajkot',
    'Sabarkantha','Surat','Surendranagar','Tapi','Vadodara','Valsad'
  )},

  // ── 9. Haryana ───────────────────────────────────────────────────
  { state: 'हरियाणा', stateEn: 'Haryana', districts: eng(
    'Ambala','Bhiwani','Charkhi Dadri','Faridabad','Fatehabad',
    'Gurugram','Hisar','Jhajjar','Jind','Kaithal','Karnal',
    'Kurukshetra','Mahendragarh','Nuh','Palwal','Panchkula',
    'Panipat','Rewari','Rohtak','Sirsa','Sonipat','Yamunanagar'
  )},

  // ── 10. Himachal Pradesh ─────────────────────────────────────────
  { state: 'हिमाचल प्रदेश', stateEn: 'Himachal Pradesh', districts: eng(
    'Bilaspur','Chamba','Hamirpur','Kangra','Kinnaur','Kullu',
    'Lahaul-Spiti','Mandi','Shimla','Sirmaur','Solan','Una'
  )},

  // ── 11. Jharkhand ────────────────────────────────────────────────
  { state: 'झारखंड', stateEn: 'Jharkhand', districts: eng(
    'Bokaro','Chatra','Deoghar','Dhanbad','Dumka','East Singhbhum',
    'Garhwa','Giridih','Godda','Gumla','Hazaribagh','Jamtara',
    'Khunti','Koderma','Latehar','Lohardaga','Pakur','Palamu',
    'Ramgarh','Ranchi','Sahibganj','Seraikela Kharsawan',
    'Simdega','West Singhbhum'
  )},

  // ── 12. Karnataka ────────────────────────────────────────────────
  { state: 'कर्नाटक', stateEn: 'Karnataka', districts: eng(
    'Bagalkot','Bangalore Rural','Bangalore Urban','Belagavi',
    'Ballari','Bidar','Chamarajanagar','Chikballapur','Chikmagalur',
    'Chitradurga','Dakshina Kannada','Davangere','Dharwad','Gadag',
    'Hassan','Haveri','Kalaburagi','Kodagu','Kolar','Koppal',
    'Mandya','Mysuru','Raichur','Ramanagara','Shivamogga',
    'Tumakuru','Udupi','Uttara Kannada','Vijayapura',
    'Vijayanagara','Yadgir'
  )},

  // ── 13. Kerala ───────────────────────────────────────────────────
  { state: 'केरळ', stateEn: 'Kerala', districts: eng(
    'Alappuzha','Ernakulam','Idukki','Kannur','Kasaragod',
    'Kollam','Kottayam','Kozhikode','Malappuram','Palakkad',
    'Pathanamthitta','Thiruvananthapuram','Thrissur','Wayanad'
  )},

  // ── 14. Madhya Pradesh ───────────────────────────────────────────
  { state: 'मध्य प्रदेश', stateEn: 'Madhya Pradesh', districts: eng(
    'Agar Malwa','Alirajpur','Anuppur','Ashoknagar','Balaghat',
    'Barwani','Betul','Bhind','Bhopal','Burhanpur','Chhatarpur',
    'Chhindwara','Damoh','Datia','Dewas','Dhar','Dindori',
    'Guna','Gwalior','Harda','Narmadapuram','Indore','Jabalpur',
    'Jhabua','Katni','Khandwa','Khargone','Maihar','Mandla',
    'Mandsaur','Mauganj','Morena','Narsinghpur','Neemuch','Niwari',
    'Pandhurna','Panna','Raisen','Rajgarh','Ratlam','Rewa',
    'Sagar','Satna','Sehore','Seoni','Shahdol','Shajapur',
    'Sheopur','Shivpuri','Sidhi','Singrauli','Tikamgarh',
    'Ujjain','Umaria','Vidisha'
  )},

  // ── 15. Manipur ──────────────────────────────────────────────────
  { state: 'मणिपूर', stateEn: 'Manipur', districts: eng(
    'Bishnupur','Chandel','Churachandpur','Imphal East','Imphal West',
    'Jiribam','Kakching','Kamjong','Kangpokpi','Noney','Pherzawl',
    'Senapati','Tamenglong','Tengnoupal','Thoubal','Ukhrul'
  )},

  // ── 16. Meghalaya ────────────────────────────────────────────────
  { state: 'मेघालय', stateEn: 'Meghalaya', districts: eng(
    'East Garo Hills','East Jaintia Hills','East Khasi Hills',
    'Eastern West Khasi Hills','North Garo Hills','Ri Bhoi',
    'South Garo Hills','South West Garo Hills','South West Khasi Hills',
    'West Garo Hills','West Jaintia Hills','West Khasi Hills'
  )},

  // ── 17. Mizoram ──────────────────────────────────────────────────
  { state: 'मिझोरम', stateEn: 'Mizoram', districts: eng(
    'Aizawl','Champhai','Hnahthial','Khawzawl','Kolasib',
    'Lawngtlai','Lunglei','Mamit','Saitual','Serchhip','Siaha'
  )},

  // ── 18. Nagaland ─────────────────────────────────────────────────
  { state: 'नागालँड', stateEn: 'Nagaland', districts: eng(
    'Chumoukedima','Dimapur','Kiphire','Kohima','Longleng',
    'Mokokchung','Mon','Niuland','Noklak','Peren','Phek',
    'Shamator','Tseminyu','Tuensang','Wokha','Zunheboto'
  )},

  // ── 19. Odisha ───────────────────────────────────────────────────
  { state: 'ओडिशा', stateEn: 'Odisha', districts: eng(
    'Angul','Balangir','Balasore','Bargarh','Bhadrak','Boudh',
    'Cuttack','Debagarh','Dhenkanal','Gajapati','Ganjam',
    'Jagatsinghpur','Jajpur','Jharsuguda','Kalahandi','Kandhamal',
    'Kendrapara','Kendujhar','Khordha','Koraput','Malkangiri',
    'Mayurbhanj','Nabarangpur','Nayagarh','Nuapada','Puri',
    'Rayagada','Sambalpur','Subarnapur','Sundergarh'
  )},

  // ── 20. Punjab ───────────────────────────────────────────────────
  { state: 'पंजाब', stateEn: 'Punjab', districts: eng(
    'Amritsar','Barnala','Bathinda','Faridkot','Fatehgarh Sahib',
    'Fazilka','Ferozepur','Gurdaspur','Hoshiarpur','Jalandhar',
    'Kapurthala','Ludhiana','Malerkotla','Mansa','Moga',
    'Mohali','Muktsar','Nawanshahr','Pathankot','Patiala',
    'Rupnagar','Sangrur','Tarn Taran'
  )},

  // ── 21. Rajasthan ────────────────────────────────────────────────
  { state: 'राजस्थान', stateEn: 'Rajasthan', districts: eng(
    'Ajmer','Alwar','Anupgarh','Balotra','Banswara','Baran',
    'Barmer','Beawar','Bharatpur','Bhilwara','Bikaner','Bundi',
    'Chittorgarh','Churu','Dausa','Deeg','Dholpur',
    'Didwana-Kuchaman','Dudu','Dungarpur','Ganganagar',
    'Gangapur City','Hanumangarh','Jaipur','Jaipur Rural',
    'Jaisalmer','Jalore','Jhalawar','Jhunjhunu','Jodhpur',
    'Jodhpur Rural','Karauli','Kekri','Khairthal-Tijara',
    'Kotputli-Behror','Kota','Nagaur','Neem Ka Thana','Pali',
    'Pratapgarh','Rajsamand','Salumbar','Sanchore',
    'Sawai Madhopur','Shahpura','Sikar','Sirohi','Tonk','Udaipur'
  )},

  // ── 22. Sikkim ───────────────────────────────────────────────────
  { state: 'सिक्कीम', stateEn: 'Sikkim', districts: eng(
    'East Sikkim','North Sikkim','Pakyong','Soreng',
    'South Sikkim','West Sikkim'
  )},

  // ── 23. Tamil Nadu ───────────────────────────────────────────────
  { state: 'तमिळनाडू', stateEn: 'Tamil Nadu', districts: eng(
    'Ariyalur','Chengalpattu','Chennai','Coimbatore','Cuddalore',
    'Dharmapuri','Dindigul','Erode','Kallakurichi','Kanchipuram',
    'Kanyakumari','Karur','Krishnagiri','Madurai','Mayiladuthurai',
    'Nagapattinam','Namakkal','Nilgiris','Perambalur','Pudukkottai',
    'Ramanathapuram','Ranipet','Salem','Sivaganga','Tenkasi',
    'Thanjavur','Theni','Thoothukudi','Tiruchirappalli','Tirunelveli',
    'Tirupathur','Tiruppur','Tiruvallur','Tiruvannamalai',
    'Tiruvarur','Vellore','Villupuram','Virudhunagar'
  )},

  // ── 24. Telangana ────────────────────────────────────────────────
  { state: 'तेलंगणा', stateEn: 'Telangana', districts: eng(
    'Adilabad','Bhadradri Kothagudem','Hanumakonda','Hyderabad',
    'Jagtial','Jangaon','Jayashankar Bhupalpally','Jogulamba Gadwal',
    'Kamareddy','Karimnagar','Khammam','Komaram Bheem',
    'Mahabubabad','Mahabubnagar','Mancherial','Medak',
    'Medchal-Malkajgiri','Mulugu','Nagarkurnool','Nalgonda',
    'Narayanpet','Nirmal','Nizamabad','Peddapalli',
    'Rajanna Sircilla','Rangareddy','Sangareddy','Siddipet',
    'Suryapet','Vikarabad','Wanaparthy','Warangal',
    'Yadadri Bhuvanagiri'
  )},

  // ── 25. Tripura ──────────────────────────────────────────────────
  { state: 'त्रिपुरा', stateEn: 'Tripura', districts: eng(
    'Dhalai','Gomati','Khowai','North Tripura',
    'Sepahijala','South Tripura','Unakoti','West Tripura'
  )},

  // ── 26. Uttar Pradesh ────────────────────────────────────────────
  { state: 'उत्तर प्रदेश', stateEn: 'Uttar Pradesh', districts: eng(
    'Agra','Aligarh','Ambedkar Nagar','Amethi','Amroha','Auraiya',
    'Ayodhya','Azamgarh','Baghpat','Bahraich','Ballia','Balrampur',
    'Banda','Barabanki','Bareilly','Basti','Bhadohi','Bijnor',
    'Budaun','Bulandshahr','Chandauli','Chitrakoot','Deoria',
    'Etah','Etawah','Farrukhabad','Fatehpur','Firozabad',
    'Gautam Buddha Nagar','Ghaziabad','Ghazipur','Gonda',
    'Gorakhpur','Hamirpur','Hapur','Hardoi','Hathras','Jalaun',
    'Jaunpur','Jhansi','Kannauj','Kanpur Dehat','Kanpur Nagar',
    'Kasganj','Kaushambi','Kushinagar','Lakhimpur Kheri',
    'Lalitpur','Lucknow','Maharajganj','Mahoba','Mainpuri',
    'Mathura','Mau','Meerut','Mirzapur','Moradabad',
    'Muzaffarnagar','Pilibhit','Pratapgarh','Prayagraj',
    'Rae Bareli','Rampur','Saharanpur','Sambhal',
    'Sant Kabir Nagar','Shahjahanpur','Shamli','Shravasti',
    'Siddharth Nagar','Sitapur','Sonbhadra','Sultanpur',
    'Unnao','Varanasi'
  )},

  // ── 27. Uttarakhand ──────────────────────────────────────────────
  { state: 'उत्तराखंड', stateEn: 'Uttarakhand', districts: eng(
    'Almora','Bageshwar','Chamoli','Champawat','Dehradun',
    'Haridwar','Nainital','Pauri Garhwal','Pithoragarh',
    'Rudraprayag','Tehri Garhwal','Udham Singh Nagar','Uttarkashi'
  )},

  // ── 28. West Bengal ──────────────────────────────────────────────
  { state: 'पश्चिम बंगाल', stateEn: 'West Bengal', districts: eng(
    'Alipurduar','Bankura','Birbhum','Cooch Behar',
    'Dakshin Dinajpur','Darjeeling','Hooghly','Howrah',
    'Jalpaiguri','Jhargram','Kalimpong','Kolkata','Malda',
    'Murshidabad','Nadia','North 24 Parganas',
    'Paschim Bardhaman','Paschim Medinipur','Purba Bardhaman',
    'Purba Medinipur','Purulia','South 24 Parganas',
    'Uttar Dinajpur'
  )},

  // ── Union Territories ────────────────────────────────────────────
  { state: 'दिल्ली', stateEn: 'Delhi', districts: eng(
    'Central Delhi','East Delhi','New Delhi','North Delhi',
    'North East Delhi','North West Delhi','Shahdara',
    'South Delhi','South East Delhi','South West Delhi','West Delhi'
  )},
  { state: 'जम्मू आणि काश्मीर', stateEn: 'Jammu & Kashmir', districts: eng(
    'Anantnag','Bandipora','Baramulla','Budgam','Doda',
    'Ganderbal','Jammu','Kathua','Kishtwar','Kulgam','Kupwara',
    'Poonch','Pulwama','Rajouri','Ramban','Reasi','Samba',
    'Shopian','Srinagar','Udhampur'
  )},
  { state: 'लडाख', stateEn: 'Ladakh', districts: eng('Kargil','Leh') },
  { state: 'चंडीगड', stateEn: 'Chandigarh', districts: eng('Chandigarh') },
  { state: 'पुदुच्चेरी', stateEn: 'Puducherry', districts: eng('Karaikal','Mahe','Puducherry','Yanam') },
  { state: 'अंदमान आणि निकोबार', stateEn: 'Andaman & Nicobar', districts: eng('Nicobar','North & Middle Andaman','South Andaman') },
  { state: 'दादरा-नगर हवेली व दमण-दीव', stateEn: 'Dadra NH & DD', districts: eng('Dadra & Nagar Haveli','Daman','Diu') },
  { state: 'लक्षद्वीप', stateEn: 'Lakshadweep', districts: eng('Lakshadweep') },
];

export const DEFAULT_STATE_IDX = 0; // Maharashtra
export const DEFAULT_DISTRICT = INDIA_STATES[0].districts.find(d => d.en === 'Amravati');

// Search: English input matches both d.en and d.name (Marathi/local)
// e.g. "ratnagiri" → matches en:"Ratnagiri" → shows "रत्नागिरी"
export function subsequenceMatch(text, query) {
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  if (t.includes(q)) return true;
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

export function filterDistricts(districts, query) {
  if (!query.trim()) return districts;
  const q = query.trim();
  return districts.filter(d =>
    subsequenceMatch(d.en, q) || subsequenceMatch(d.name, q)
  );
}
