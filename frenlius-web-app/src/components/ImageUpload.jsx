import React, { useState } from 'react';
import axios from 'axios';

const ImageUpload = ({ selectedRoute }) => {
  const [images, setImages] = useState([]);

  const handleFolderChange = (event) => {
    const files = Array.from(event.target.files);
    setImages(files);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedRoute || images.length === 0) {
      alert('Selecciona una ruta y una carpeta con imágenes.');
      return;
    }

    const imageNames = images.map(image => `${selectedRoute}/${image.name}`).join(',');

    try {
      const response = await axios.post('https://xsw6ikn9dd.execute-api.us-east-2.amazonaws.com/prod/upload-image', {
        image_keys: imageNames
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const { urls } = response.data;

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const uploadUrl = urls.find(url => url.image_key.endsWith(`/${image.name}`)).uploadUrl;

        await axios.put(uploadUrl, image, {
          headers: {
            'Content-Type': image.type
          }
        });
      }

      alert('Imágenes subidas con éxito!');
      setImages([]);

    } catch (error) {
      console.error('Error al subir las imágenes:', error);
      alert('Error al subir las imágenes');
    }
  };

  return (
    <div className="card p-3" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h4 className="text-primary mb-3">Subir Imágenes</h4>
        
        <form onSubmit={handleSubmit}>
            <div className="mb-3">
                <label className="form-label fw-bold d-block mb-2">
                    Selecciona una carpeta:
                </label>
                <div className="input-group">
                    <input 
                        type="file" 
                        className="form-control" 
                        webkitdirectory="true" 
                        directory="true" 
                        onChange={handleFolderChange}
                    />
                    {images.length > 0 && (
                        <span className="input-group-text">
                            {images.length} archivos
                        </span>
                    )}
                </div>
            </div>
            
            <button type="submit" className="btn btn-primary w-100">
                Subir Imágenes
            </button>
        </form>

        {images.length > 0 && (
            <div className="mt-3">
                <h5 className="fw-bold">Imágenes seleccionadas:</h5>
                <div className="mt-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {images.map((image, index) => (
                        <div key={index} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                            <span className="text-truncate" style={{ maxWidth: '70%' }}>
                                {image.name}
                            </span>
                            <span className="badge bg-secondary">
                                {(image.size / 1024).toFixed(2)} KB
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
  );
};

export default ImageUpload;

//--------------------------------------------------------------------------------
// import React, { useState } from 'react';
// import axios from 'axios';

// const ImageUpload = ({ selectedRoute }) => {
//   const [images, setImages] = useState([]);

//   const handleFolderChange = (event) => {
//     const files = Array.from(event.target.files);
//     setImages(files);
//   };

//   const handleSubmit = async (event) => {
//     event.preventDefault();

//     if (!selectedRoute || images.length === 0) {
//       alert('Selecciona una ruta y una carpeta con imágenes.');
//       return;
//     }

//     const imageNames = images.map(image => `${selectedRoute}/${image.name}`).join(',');

//     try {
//       const response = await axios.post('https://xsw6ikn9dd.execute-api.us-east-2.amazonaws.com/prod/upload-image', {
//         image_keys: imageNames
//       }, {
//         headers: {
//           'Content-Type': 'application/json'
//         }
//       });

//       const { urls } = response.data;

//       for (let i = 0; i < images.length; i++) {
//         const image = images[i];
//         const uploadUrl = urls.find(url => url.image_key.endsWith(`/${image.name}`)).uploadUrl;

//         await axios.put(uploadUrl, image, {
//           headers: {
//             'Content-Type': image.type
//           }
//         });

//         console.log(`Imagen ${image.name} subida correctamente.`);
//       }

//       alert('Imágenes subidas con éxito.');
//       window.location.reload();

//     } catch (error) {
//       console.error('Error al subir las imágenes:', error);
//     }
//   };

//   return (
//     <div className="container mt-4">
//       <h3 className="text-primary">Subir Imágenes</h3>
//       <form onSubmit={handleSubmit} className="p-4 rounded-3 shadow-sm" style={{ backgroundColor: '#f8f9fa' }}>
//         <div className="form-group">
//           <label htmlFor="imageUpload" className="form-label">Selecciona una Carpeta:</label>
//           <input
//             type="file"
//             className="form-control"
//             id="imageUpload"
//             directory=""
//             webkitdirectory=""
//             multiple
//             onChange={handleFolderChange}
//           />
//         </div>

//         <button type="submit" className="btn mt-3" style={{ backgroundColor: '#001f3f', color: 'white' }}>
//           Subir Imágenes
//         </button>
//       </form>

//       <div className="mt-4">
//         <h5>Imágenes seleccionadas:</h5>
//         <ul className="list-group">
//           {images.map((image, index) => (
//             <li key={index} className="list-group-item">
//               {image.name}
//             </li>
//           ))}
//         </ul>
//       </div>
//     </div>
//   );
// };

// export default ImageUpload;


