// Suggestions for the pickup / drop-off fields. Customers can still type ANY place
// (a hotel name, a street address, a village) — these only speed things up.
const P = (name, area, type = 'town') => ({ name, area, type });

export const SRI_LANKA_PLACES = [
  // Kandy area
  P('Kandy City Centre', 'Kandy', 'city'), P('Kandy Railway Station', 'Kandy', 'station'), P('Kandy Lake', 'Kandy', 'landmark'),
  P('Temple of the Tooth (Sri Dalada Maligawa)', 'Kandy', 'landmark'), P('Peradeniya Botanical Gardens', 'Kandy', 'landmark'),
  P('Peradeniya', 'Kandy'), P('Katugastota', 'Kandy'), P('Digana', 'Kandy'), P('Kundasale', 'Kandy'), P('Gampola', 'Kandy'),
  P('Pilimathalawa', 'Kandy'), P('Kadugannawa', 'Kandy'), P('Akurana', 'Kandy'), P('Tennekumbura', 'Kandy'), P('Ampitiya', 'Kandy'),
  P('Gelioya', 'Kandy'), P('Nawalapitiya', 'Kandy'), P('Teldeniya', 'Kandy'), P('Pallekele', 'Kandy'), P('Hanthana', 'Kandy'),
  P('Matale', 'Matale'), P('Knuckles Mountain Range', 'Matale', 'landmark'),
  // Airports
  P('Bandaranaike International Airport (CMB), Katunayake', 'Gampaha', 'airport'), P('Mattala Rajapaksa International Airport (HRI)', 'Hambantota', 'airport'),
  P('Colombo Ratmalana Airport', 'Colombo', 'airport'), P('Jaffna International Airport', 'Jaffna', 'airport'),
  // Colombo & west
  P('Colombo City', 'Colombo', 'city'), P('Colombo Fort Railway Station', 'Colombo', 'station'), P('Colombo 03 (Kollupitiya)', 'Colombo'),
  P('Colombo 07 (Cinnamon Gardens)', 'Colombo'), P('Bambalapitiya', 'Colombo'), P('Wellawatte', 'Colombo'), P('Dehiwala', 'Colombo'),
  P('Mount Lavinia', 'Colombo', 'beach'), P('Rajagiriya', 'Colombo'), P('Battaramulla', 'Colombo'), P('Nugegoda', 'Colombo'),
  P('Maharagama', 'Colombo'), P('Kottawa', 'Colombo'), P('Moratuwa', 'Colombo'), P('Panadura', 'Kalutara'), P('Negombo', 'Gampaha', 'beach'),
  P('Katunayake', 'Gampaha'), P('Ja-Ela', 'Gampaha'), P('Wattala', 'Gampaha'), P('Kadawatha', 'Gampaha'), P('Gampaha', 'Gampaha'),
  P('Kalutara', 'Kalutara', 'beach'), P('Wadduwa', 'Kalutara', 'beach'), P('Beruwala', 'Kalutara', 'beach'), P('Aluthgama', 'Kalutara'),
  P('Bentota', 'Galle', 'beach'), P('Induruwa', 'Galle', 'beach'), P('Kegalle', 'Kegalle'), P('Pinnawala Elephant Orphanage', 'Kegalle', 'landmark'),
  P('Kitulgala', 'Kegalle'), P('Avissawella', 'Colombo'),
  // South coast
  P('Ambalangoda', 'Galle', 'beach'), P('Hikkaduwa', 'Galle', 'beach'), P('Galle Fort', 'Galle', 'landmark'), P('Galle City', 'Galle', 'city'),
  P('Unawatuna', 'Galle', 'beach'), P('Koggala', 'Galle', 'beach'), P('Ahangama', 'Galle', 'beach'), P('Weligama', 'Matara', 'beach'),
  P('Mirissa', 'Matara', 'beach'), P('Matara', 'Matara'), P('Dikwella', 'Matara', 'beach'), P('Tangalle', 'Hambantota', 'beach'),
  P('Hambantota', 'Hambantota'), P('Tissamaharama', 'Hambantota'), P('Yala National Park', 'Hambantota', 'landmark'),
  P('Kataragama', 'Monaragala'), P('Udawalawe National Park', 'Ratnapura', 'landmark'), P('Sinharaja Rainforest', 'Ratnapura', 'landmark'),
  P('Ratnapura', 'Ratnapura'), P('Embilipitiya', 'Ratnapura'),
  // Hill country
  P('Nuwara Eliya', 'Nuwara Eliya', 'city'), P('Gregory Lake, Nuwara Eliya', 'Nuwara Eliya', 'landmark'), P('Nanu Oya Railway Station', 'Nuwara Eliya', 'station'),
  P('Horton Plains National Park', 'Nuwara Eliya', 'landmark'), P('Ramboda', 'Nuwara Eliya'), P('Hatton', 'Nuwara Eliya'), P('Talawakele', 'Nuwara Eliya'),
  P('Adam’s Peak (Sri Pada), Dalhousie', 'Nuwara Eliya', 'landmark'), P('Maskeliya', 'Nuwara Eliya'), P('Ella', 'Badulla', 'town'),
  P('Ella Railway Station', 'Badulla', 'station'), P('Nine Arches Bridge, Demodara', 'Badulla', 'landmark'), P('Bandarawela', 'Badulla'),
  P('Haputale', 'Badulla'), P('Badulla', 'Badulla'), P('Welimada', 'Badulla'), P('Passara', 'Badulla'), P('Monaragala', 'Monaragala'),
  // Cultural triangle & north central
  P('Sigiriya', 'Matale', 'landmark'), P('Dambulla', 'Matale'), P('Dambulla Cave Temple', 'Matale', 'landmark'), P('Habarana', 'Anuradhapura'),
  P('Minneriya National Park', 'Polonnaruwa', 'landmark'), P('Polonnaruwa', 'Polonnaruwa'), P('Anuradhapura', 'Anuradhapura'),
  P('Kurunegala', 'Kurunegala'), P('Puttalam', 'Puttalam'), P('Kalpitiya', 'Puttalam', 'beach'), P('Chilaw', 'Puttalam'),
  P('Wilpattu National Park', 'Puttalam', 'landmark'), P('Mihintale', 'Anuradhapura', 'landmark'),
  // East
  P('Trincomalee', 'Trincomalee', 'city'), P('Nilaveli', 'Trincomalee', 'beach'), P('Uppuveli', 'Trincomalee', 'beach'),
  P('Pasikudah', 'Batticaloa', 'beach'), P('Batticaloa', 'Batticaloa'), P('Arugam Bay', 'Ampara', 'beach'), P('Ampara', 'Ampara'),
  // North
  P('Jaffna', 'Jaffna', 'city'), P('Vavuniya', 'Vavuniya'), P('Mannar', 'Mannar'), P('Kilinochchi', 'Kilinochchi'),
];

export const PLACE_TYPES = { office: 'Our office', hotel: 'Hotel delivery', station: 'Railway station', airport: 'Airport', city: 'City', area: 'Area', town: 'Town', beach: 'Beach', landmark: 'Landmark' };
