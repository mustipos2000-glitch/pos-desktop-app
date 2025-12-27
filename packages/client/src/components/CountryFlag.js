import React from 'react';

/**
 * CountryFlag Component
 * Displays country flag based on phone number
 * Properly centered vertically in input fields
 * 
 * Accepts 'flag' prop (from your country flag module) or 'phone' prop
 */

// Country code to flag emoji mapping
const countryFlags = {
  '1': '🇺🇸', // US/Canada
  '31': '🇳🇱', // Netherlands
  '32': '🇧🇪', // Belgium
  '33': '🇫🇷', // France
  '34': '🇪🇸', // Spain
  '39': '🇮🇹', // Italy
  '44': '🇬🇧', // UK
  '49': '🇩🇪', // Germany
  '81': '🇯🇵', // Japan
  '82': '🇰🇷', // South Korea
  '86': '🇨🇳', // China
  '91': '🇮🇳', // India
  '212': '🇲🇦', // Morocco
  '213': '🇩🇿', // Algeria
  '216': '🇹🇳', // Tunisia
  '218': '🇱🇾', // Libya
  '220': '🇬🇲', // Gambia
  '221': '🇸🇳', // Senegal
  '222': '🇲🇷', // Mauritania
  '223': '🇲🇱', // Mali
  '224': '🇬🇳', // Guinea
  '225': '🇨🇮', // Ivory Coast
  '226': '🇧🇫', // Burkina Faso
  '227': '🇳🇪', // Niger
  '228': '🇹🇬', // Togo
  '229': '🇧🇯', // Benin
  '230': '🇲🇺', // Mauritius
  '231': '🇱🇷', // Liberia
  '232': '🇸🇱', // Sierra Leone
  '233': '🇬🇭', // Ghana
  '234': '🇳🇬', // Nigeria
  '235': '🇹🇩', // Chad
  '236': '🇨🇫', // Central African Republic
  '237': '🇨🇲', // Cameroon
  '238': '🇨🇻', // Cape Verde
  '239': '🇸🇹', // São Tomé and Príncipe
  '240': '🇬🇶', // Equatorial Guinea
  '241': '🇬🇦', // Gabon
  '242': '🇨🇬', // Republic of the Congo
  '243': '🇨🇩', // Democratic Republic of the Congo
  '244': '🇦🇴', // Angola
  '245': '🇬🇼', // Guinea-Bissau
  '246': '🇮🇴', // British Indian Ocean Territory
  '248': '🇸🇨', // Seychelles
  '249': '🇸🇩', // Sudan
  '250': '🇷🇼', // Rwanda
  '251': '🇪🇹', // Ethiopia
  '252': '🇸🇴', // Somalia
  '253': '🇩🇯', // Djibouti
  '254': '🇰🇪', // Kenya
  '255': '🇹🇿', // Tanzania
  '256': '🇺🇬', // Uganda
  '257': '🇧🇮', // Burundi
  '258': '🇲🇿', // Mozambique
  '260': '🇿🇲', // Zambia
  '261': '🇲🇬', // Madagascar
  '262': '🇷🇪', // Réunion
  '263': '🇿🇼', // Zimbabwe
  '264': '🇳🇦', // Namibia
  '265': '🇲🇼', // Malawi
  '266': '🇱🇸', // Lesotho
  '267': '🇧🇼', // Botswana
  '268': '🇸🇿', // Eswatini
  '269': '🇰🇲', // Comoros
  '290': '🇸🇭', // Saint Helena
  '291': '🇪🇷', // Eritrea
  '297': '🇦🇼', // Aruba
  '298': '🇫🇴', // Faroe Islands
  '299': '🇬🇱', // Greenland
  '350': '🇬🇮', // Gibraltar
  '351': '🇵🇹', // Portugal
  '352': '🇱🇺', // Luxembourg
  '353': '🇮🇪', // Ireland
  '354': '🇮🇸', // Iceland
  '356': '🇲🇹', // Malta
  '357': '🇨🇾', // Cyprus
  '358': '🇫🇮', // Finland
  '359': '🇧🇬', // Bulgaria
  '370': '🇱🇹', // Lithuania
  '371': '🇱🇻', // Latvia
  '372': '🇪🇪', // Estonia
  '373': '🇲🇩', // Moldova
  '374': '🇦🇲', // Armenia
  '375': '🇧🇾', // Belarus
  '376': '🇦🇩', // Andorra
  '377': '🇲🇨', // Monaco
  '378': '🇸🇲', // San Marino
  '380': '🇺🇦', // Ukraine
  '381': '🇷🇸', // Serbia
  '382': '🇲🇪', // Montenegro
  '383': '🇽🇰', // Kosovo
  '385': '🇭🇷', // Croatia
  '386': '🇸🇮', // Slovenia
  '387': '🇧🇦', // Bosnia and Herzegovina
  '389': '🇲🇰', // North Macedonia
  '420': '🇨🇿', // Czech Republic
  '421': '🇸🇰', // Slovakia
  '423': '🇱🇮', // Liechtenstein
  '500': '🇫🇰', // Falkland Islands
  '501': '🇧🇿', // Belize
  '502': '🇬🇹', // Guatemala
  '503': '🇸🇻', // El Salvador
  '504': '🇭🇳', // Honduras
  '505': '🇳🇮', // Nicaragua
  '506': '🇨🇷', // Costa Rica
  '507': '🇵🇦', // Panama
  '508': '🇵🇲', // Saint Pierre and Miquelon
  '509': '🇭🇹', // Haiti
  '590': '🇧🇱', // Saint Barthélemy
  '591': '🇧🇴', // Bolivia
  '592': '🇬🇾', // Guyana
  '593': '🇪🇨', // Ecuador
  '594': '🇬🇫', // French Guiana
  '595': '🇵🇾', // Paraguay
  '596': '🇲🇶', // Martinique
  '597': '🇸🇷', // Suriname
  '598': '🇺🇾', // Uruguay
  '599': '🇧🇶', // Bonaire
  '670': '🇹🇱', // East Timor
  '672': '🇦🇶', // Antarctica
  '673': '🇧🇳', // Brunei
  '674': '🇳🇷', // Nauru
  '675': '🇵🇬', // Papua New Guinea
  '676': '🇹🇴', // Tonga
  '677': '🇸🇧', // Solomon Islands
  '678': '🇻🇺', // Vanuatu
  '679': '🇫🇯', // Fiji
  '680': '🇵🇼', // Palau
  '681': '🇼🇫', // Wallis and Futuna
  '682': '🇨🇰', // Cook Islands
  '683': '🇳🇺', // Niue
  '685': '🇼🇸', // Samoa
  '686': '🇰🇮', // Kiribati
  '687': '🇳🇨', // New Caledonia
  '688': '🇹🇻', // Tuvalu
  '689': '🇵🇫', // French Polynesia
  '850': '🇰🇵', // North Korea
  '852': '🇭🇰', // Hong Kong
  '853': '🇲🇴', // Macau
  '855': '🇰🇭', // Cambodia
  '856': '🇱🇦', // Laos
  '880': '🇧🇩', // Bangladesh
  '886': '🇹🇼', // Taiwan
  '960': '🇲🇻', // Maldives
  '961': '🇱🇧', // Lebanon
  '962': '🇯🇴', // Jordan
  '963': '🇸🇾', // Syria
  '964': '🇮🇶', // Iraq
  '965': '🇰🇼', // Kuwait
  '966': '🇸🇦', // Saudi Arabia
  '967': '🇾🇪', // Yemen
  '968': '🇴🇲', // Oman
  '970': '🇵🇸', // Palestine
  '971': '🇦🇪', // UAE
  '972': '🇮🇱', // Israel
  '973': '🇧🇭', // Bahrain
  '974': '🇶🇦', // Qatar
  '975': '🇧🇹', // Bhutan
  '976': '🇲🇳', // Mongolia
  '977': '🇳🇵', // Nepal
  '992': '🇹🇯', // Tajikistan
  '993': '🇹🇲', // Turkmenistan
  '994': '🇦🇿', // Azerbaijan
  '995': '🇬🇪', // Georgia
  '996': '🇰🇬', // Kyrgyzstan
  '998': '🇺🇿', // Uzbekistan
};

// Detect country code from phone number
const detectCountryCode = (phone) => {
  if (!phone || typeof phone !== 'string') return null;
  
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (!cleaned) return null;
  
  // Remove leading +
  const digits = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;
  if (!digits) return null;
  
  // Try 3-digit codes first (longer codes)
  if (digits.length >= 3) {
    const code3 = digits.substring(0, 3);
    if (countryFlags[code3]) return code3;
  }
  
  // Try 2-digit codes
  if (digits.length >= 2) {
    const code2 = digits.substring(0, 2);
    if (countryFlags[code2]) return code2;
  }
  
  // Try 1-digit code (US/Canada)
  if (digits.length >= 1) {
    const code1 = digits.substring(0, 1);
    if (countryFlags[code1]) return code1;
  }
  
  return null;
};

const CountryFlag = ({ phone, flag, className = '', style = {} }) => {
  // Use flag prop if provided, otherwise detect from phone
  let displayFlag = flag;
  
  if (!displayFlag && phone) {
    const countryCode = detectCountryCode(phone);
    if (countryCode) {
      displayFlag = countryFlags[countryCode];
    }
  }
  
  if (!displayFlag || !displayFlag.trim()) {
    return null;
  }

  return (
    <div
      className={`flex items-center justify-center pointer-events-none ${className}`}
      style={{
        width: '32px',
        height: '32px',
        ...style
      }}
      role="img"
      aria-label="Country flag"
    >
      <span
        style={{
          fontSize: '24px',
          lineHeight: '1',
          display: 'inline-block',
          verticalAlign: 'middle'
        }}
      >
        {displayFlag}
      </span>
    </div>
  );
};

export default CountryFlag;
