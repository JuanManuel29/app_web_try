// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import "../styles/main.css";

// const FlightSelection = ({ onRouteSelect }) => {
//     const [routes, setRoutes] = useState([]);
//     const [selectedRoute, setSelectedRoute] = useState("");
//     const [useCurrentTime, setUseCurrentTime] = useState(true);
//     const [showManualFields, setShowManualFields] = useState(false);
//     const [customDateTime, setCustomDateTime] = useState({
//         year: "",
//         month: "",
//         day: "",
//         hour: "",
//         minute: ""
//     });
//     const [flightName, setFlightName] = useState("");
//     const [errorMessage, setErrorMessage] = useState("");

//     useEffect(() => {
//         const fetchRoutes = async () => {
//             try {
//                 const response = await axios.get("https://9qqsfb1gy1.execute-api.us-east-2.amazonaws.com/prod/list-routes");
//                 const data = response.data.routes;
//                 setRoutes(data);
//             } catch (error) {
//                 console.error("Error al obtener rutas:", error);
//             }
//         };

//         fetchRoutes();
//     }, []);

//     const handleSelect = (event) => {
//         const route = event.target.value;
//         setSelectedRoute(route);
//         setFlightName("");
//         setErrorMessage("");
//     };

//     const handleUseCurrentTime = () => {
//         setUseCurrentTime(true);
//         setShowManualFields(false);
//         setErrorMessage("");
//         const now = new Date();
//         const formattedDate = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
//         const fullFlightName = `${selectedRoute}-${formattedDate}`;
//         setFlightName(fullFlightName);
//         onRouteSelect(fullFlightName);
//     };

//     const handleManualSelection = () => {
//         setUseCurrentTime(false);
//         setShowManualFields(true);
//         setErrorMessage("");
//     };

//     const isLeapYear = (year) => {
//         return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
//     };

//     const handleCustomDateChange = (field, value) => {
//         setCustomDateTime(prev => ({ ...prev, [field]: value }));
//         setErrorMessage("");
//     };

//     const validateDateTime = () => {
//         const { year, month, day, hour, minute } = customDateTime;
//         const now = new Date();

//         // Verificar que todos los campos estén llenos
//         if (!year || !month || !day || !hour || !minute) {
//             setErrorMessage("Por favor completa todos los campos de fecha y hora.");
//             return false;
//         }

//         // Verificar valores numéricos
//         if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute)) {
//             setErrorMessage("Todos los campos deben ser números.");
//             return false;
//         }

//         // Validaciones específicas
//         if (month < 1 || month > 12) {
//             setErrorMessage("El mes debe estar entre 01 y 12.");
//             return false;
//         }
//         if (hour < 0 || hour > 23) {
//             setErrorMessage("La hora debe estar entre 00 y 23.");
//             return false;
//         }
//         if (minute < 0 || minute > 59) {
//             setErrorMessage("El minuto debe estar entre 00 y 59.");
//             return false;
//         }

//         // Validar días del mes
//         const daysInMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
//         if (day < 1 || day > daysInMonth[month - 1]) {
//             setErrorMessage("El día no es válido para el mes especificado.");
//             return false;
//         }

//         // Verificar que la fecha no sea futura
//         const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`;
//         const selectedDateTime = new Date(formattedDate);

//         if (selectedDateTime > now) {
//             setErrorMessage("La fecha no puede ser mayor a la actual.");
//             return false;
//         }

//         setErrorMessage("");
//         return true;
//     };

    

//     const handleBuildCustomFlightName = () => {
//         const isValid = validateDateTime();
//         if (isValid) {
//             const { year, month, day, hour, minute } = customDateTime;
//             const formattedDate = `${year}${month.padStart(2, '0')}${day.padStart(2, '0')}-${hour.padStart(2, '0')}${minute.padStart(2, '0')}`;
//             const fullFlightName = `${selectedRoute}-${formattedDate}`;
//             setFlightName(fullFlightName);
//             onRouteSelect(fullFlightName);
//             setErrorMessage("");
//         }
//     };

//     return (
//         <div className="mb-3">
//             <label htmlFor="flightRoute" className="form-label text-primary fw-bold">
//                 Selecciona una ruta de vuelo
//             </label>
//             <select
//                 className="form-select border-primary text-dark"
//                 id="flightRoute"
//                 value={selectedRoute}
//                 onChange={handleSelect}
//             >
//                 <option value=""></option>
//                 {routes.map((route, index) => (
//                     <option key={index} value={route}>
//                         {route}
//                     </option>
//                 ))}
//             </select>

//             {selectedRoute && (
//                 <div className="mt-3 p-3 border rounded-3 shadow-sm bg-light">
//                     <button className="btn btn-primary me-2 text-white border-0" style={{ backgroundColor: '#001f3f' }} onClick={handleUseCurrentTime}>
//                         Usar hora actual
//                     </button>
//                     <button className="btn btn-secondary text-white border-0" style={{ backgroundColor: '#6c757d' }} onClick={handleManualSelection}>
//                         Seleccionar fecha manualmente
//                     </button>
//                 </div>
//             )}

//             {showManualFields && (
//                 <div className="mt-3 p-3 border rounded-3 shadow-sm bg-light">
//                     <input type="text" placeholder="Año (aaaa)" value={customDateTime.year} onChange={(e) => handleCustomDateChange("year", e.target.value)} className="form-control mb-2 border-primary text-dark" />
//                     <input type="text" placeholder="Mes (mm)" value={customDateTime.month} onChange={(e) => handleCustomDateChange("month", e.target.value)} className="form-control mb-2 border-primary text-dark" />
//                     <input type="text" placeholder="Día (dd)" value={customDateTime.day} onChange={(e) => handleCustomDateChange("day", e.target.value)} className="form-control mb-2 border-primary text-dark" />
//                     <input type="text" placeholder="Hora (hh en 24h)" value={customDateTime.hour} onChange={(e) => handleCustomDateChange("hour", e.target.value)} className="form-control mb-2 border-primary text-dark" />
//                     <input type="text" placeholder="Minuto (mm)" value={customDateTime.minute} onChange={(e) => handleCustomDateChange("minute", e.target.value)} className="form-control mb-2 border-primary text-dark" />
//                     <button className="btn text-white border-0" style={{ backgroundColor: '#d9534f' }} onClick={handleBuildCustomFlightName}>
//                         Construir nombre de vuelo
//                     </button>
//                     {errorMessage && <p className="text-danger mt-2 fw-bold">{errorMessage}</p>}
//                 </div>
//             )}

//             {
//             flightName && (
//                  <div className="mt-3 p-3 border rounded-3 shadow-sm bg-light">
//                      <p>Vuelo seleccionado: <strong>{flightName}</strong></p>
//                  </div>
//              )
//             }
//         </div>
//     );
// };


//########################------------------------------------------------------------------------####################################

import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/main.css";

const FlightSelection = ({ onRouteSelect }) => {
    const [routes, setRoutes] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState("");
    const [useCurrentTime, setUseCurrentTime] = useState(true);
    const [showManualFields, setShowManualFields] = useState(false);
    const [customDateTime, setCustomDateTime] = useState({
        year: "", month: "", day: "", hour: "", minute: ""
    });
    const [flightName, setFlightName] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        const fetchRoutes = async () => {
            try {
                const response = await axios.get("https://9qqsfb1gy1.execute-api.us-east-2.amazonaws.com/prod/list-routes");
                const data = response.data.routes;
                setRoutes(data);
            } catch (error) {
                console.error("Error al obtener rutas:", error);
            }
        };

        fetchRoutes();
    }, []);

    const handleSelect = (event) => {
        const route = event.target.value;
        setSelectedRoute(route);
        setFlightName("");
        setErrorMessage("");
    };

    const handleUseCurrentTime = () => {
        setUseCurrentTime(true);
        setShowManualFields(false);
        setErrorMessage("");
        const now = new Date();
        const formattedDate = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
        const fullFlightName = `${selectedRoute}-${formattedDate}`;
        setFlightName(fullFlightName);
        onRouteSelect(fullFlightName);
    };

    const handleManualSelection = () => {
        setUseCurrentTime(false);
        setShowManualFields(true);
        setErrorMessage("");
    };

    const isLeapYear = (year) => {
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    };

    const handleCustomDateChange = (field, value) => {
        setCustomDateTime(prev => ({ ...prev, [field]: value }));
        setErrorMessage("");
    };

    const validateDateTime = () => {
        const { year, month, day, hour, minute } = customDateTime;
        const now = new Date();

        if (!year || !month || !day || !hour || !minute) {
            setErrorMessage("Por favor completa todos los campos de fecha y hora.");
            return false;
        }

        if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute)) {
            setErrorMessage("Todos los campos deben ser números.");
            return false;
        }

        if (month < 1 || month > 12) {
            setErrorMessage("El mes debe estar entre 01 y 12.");
            return false;
        }

        if (hour < 0 || hour > 23) {
            setErrorMessage("La hora debe estar entre 00 y 23.");
            return false;
        }

        if (minute < 0 || minute > 59) {
            setErrorMessage("El minuto debe estar entre 00 y 59.");
            return false;
        }

        const daysInMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        if (day < 1 || day > daysInMonth[month - 1]) {
            setErrorMessage("El día no es válido para el mes especificado.");
            return false;
        }

        const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`;
        const selectedDateTime = new Date(formattedDate);

        if (selectedDateTime > now) {
            setErrorMessage("La fecha no puede ser mayor a la actual.");
            return false;
        }

        setErrorMessage("");
        return true;
    };

    const handleBuildCustomFlightName = () => {
        const isValid = validateDateTime();
        if (isValid) {
            const { year, month, day, hour, minute } = customDateTime;
            const formattedDate = `${year}${month.padStart(2, '0')}${day.padStart(2, '0')}-${hour.padStart(2, '0')}${minute.padStart(2, '0')}`;
            const fullFlightName = `${selectedRoute}-${formattedDate}`;
            setFlightName(fullFlightName);
            onRouteSelect(fullFlightName);
            setErrorMessage("");
        }
    };

    return (
        <div className="card p-3 mb-4" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h4 className="text-primary mb-3">Selecciona una ruta de vuelo</h4>
            
            <div className="mb-3">
                <select
                    className="form-select border-primary"
                    value={selectedRoute}
                    onChange={handleSelect}
                >
                    <option value="">Selecciona una opción</option>
                    {routes.map((route) => (
                        <option key={route} value={route}>{route}</option>
                    ))}
                </select>
            </div>
    
            {selectedRoute && (
                <div className="d-flex gap-2 mb-3">
                    <button 
                        className="btn btn-primary flex-grow-1"
                        onClick={handleUseCurrentTime}
                    >
                        Usar hora actual
                    </button>
                    <button 
                        className="btn btn-outline-primary flex-grow-1"
                        onClick={handleManualSelection}
                    >
                        {showManualFields ? 'Ocultar campos' : 'Fecha manual'}
                    </button>
                </div>
            )}
    
            {showManualFields && (
                <div className="manual-fields card p-3 mb-3 bg-light">
                    <div className="row g-2">
                        {[
                            { id: 'year', placeholder: 'Año (aaaa)' },
                            { id: 'month', placeholder: 'Mes (mm)' },
                            { id: 'day', placeholder: 'Día (dd)' },
                            { id: 'hour', placeholder: 'Hora (24h)' },
                            { id: 'minute', placeholder: 'Minuto (mm)' }
                        ].map((field) => (
                            <div key={field.id} className="col-12 col-sm-6 col-lg-4 col-xl-3">
                                <input
                                    type="text"
                                    placeholder={field.placeholder}
                                    value={customDateTime[field.id]}
                                    onChange={(e) => handleCustomDateChange(field.id, e.target.value)}
                                    className="form-control"
                                />
                            </div>
                        ))}
                    </div>
                    
                    <button 
                        className="btn btn-danger mt-3 w-100"
                        onClick={handleBuildCustomFlightName}
                    >
                        Construir nombre de vuelo
                    </button>
                    
                    {errorMessage && (
                        <div className="alert alert-danger mt-3 mb-0">{errorMessage}</div>
                    )}
                </div>
            )}
    
            {flightName && (
                <div className="alert alert-success mt-3 mb-0">
                    <strong>Vuelo seleccionado:</strong> {flightName}
                </div>
            )}
        </div>
    );
};

export default FlightSelection;