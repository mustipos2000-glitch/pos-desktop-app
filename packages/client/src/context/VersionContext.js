import React, { createContext, useContext, useState, useEffect } from 'react';

const VersionContext = createContext();

export const useVersion = () => {
  const context = useContext(VersionContext);
  if (!context) {
    throw new Error('useVersion must be used within a VersionProvider');
  }
  return context;
};

export const VersionProvider = ({ children }) => {
  const [version, setVersion] = useState(() => {
    return localStorage.getItem('posVersion') || null;
  });

  useEffect(() => {
    if (version) {
      localStorage.setItem('posVersion', version);
    }
  }, [version]);

  const changeVersion = (newVersion) => {
    setVersion(newVersion);
    localStorage.setItem('posVersion', newVersion);
  };

  const clearVersion = () => {
    setVersion(null);
    localStorage.removeItem('posVersion');
  };

  const versionConfig = {
    horeca: {
      name: 'Horeca POS',
      features: {
        categoryProducts: true,
        tables: true,
        kitchenPrinter: true,
        splitTables: true,
        customerDisplay: true,
        cashDrawer: true,
        labelPrinter: true,
        inventory: false,
        eatInTakeOut: true,
        clients: true,
        buttonClientOnHold: true,
        handheldTablet: true,
        pickupDelivery: true,
        giftCards: true,
        clockIn: true,
        multiShop: true
      }
    },
    retail: {
      name: 'Retail POS',
      features: {
        categoryProducts: true,
        tables: false,
        kitchenPrinter: false,
        splitTables: false,
        customerDisplay: true,
        cashDrawer: true,
        labelPrinter: true,
        inventory: true,
        eatInTakeOut: false,
        clients: true,
        buttonClientOnHold: true,
        handheldScanner: true,
        returns: true,
        pickupDelivery: true,
        giftCards: true,
        clockIn: true,
        multiShop: true
      }
    },
    kiosk: {
      name: 'Kiosk POS',
      features: {
        categoryProducts: true,
        tables: false,
        kitchenPrinter: true,
        splitTables: false,
        customerDisplay: false,
        cashDrawer: false,
        labelPrinter: false,
        inventory: false,
        eatInTakeOut: true,
        clients: false,
        buttonClientOnHold: false,
        giftCards: true,
        promotions: true
      }
    },
    mosque: {
      name: 'Kiosk Mosque',
      features: {
        categoryProducts: false,
        tables: false,
        kitchenPrinter: false,
        splitTables: false,
        customerDisplay: false,
        cashDrawer: false,
        labelPrinter: false,
        inventory: false,
        eatInTakeOut: false,
        clients: false,
        buttonClientOnHold: false,
        promotions: false
      }
    }
  };

  const currentConfig = version ? versionConfig[version] : null;

  const hasFeature = (featureName) => {
    return currentConfig?.features[featureName] || false;
  };

  return (
    <VersionContext.Provider value={{ 
      version, 
      changeVersion, 
      clearVersion, 
      currentConfig,
      hasFeature 
    }}>
      {children}
    </VersionContext.Provider>
  );
};
