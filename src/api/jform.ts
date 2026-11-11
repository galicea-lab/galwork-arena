import axios, { AxiosRequestConfig } from 'axios';
import CONFIG from '../configs/config';

export interface WResult {
  code: 0;
  message: string;
  result : string
}


export interface Karta {
    comment: string;
    rokStudiow: number;
    rokAkademicki: string;
    kierunek: string;
    semestr: string;
    specjalnosc: string;
    student: string;
    ects: string;
    ktoPodpisuje: string;
}

export interface NewForm {
    formtype: number|string; // np. 229,
    kierunek: string;
    student : string; // nr_albumu
    email : string; // e-mail studenta
    grupa: string; //'stud' = studenci
}

export interface ReqSTUD {
  nr_albumu : string; // nr_albumu
  email : string; // e-mail studenta
}

export interface MLS {
  date: string;
  state: string;
  qr : string; // QR Code
  actCode : string; // kod aktywacyjny
  relDate : string; // data wydania
  expireDate: string  // data ważności kodu
}

export interface RelMLS {
  code: 0;
  message: string;
  mls : MLS
}

export interface KO {
  AZS: string;
  Akademik: string;
  Biblioteka: string;
  BOS: string;
  Kwestura : string;
}

export interface RelKO {
  code: 0;
  message: string;
  ko : KO
}

export interface ZOS {
    kierunek: string;
    rokAkademicki: string;
    rokStudiow: string;
    semestr: string;
    semestrStudiow: string;
    poziomStudiow: string;
    trybStudiow: string;
    student: string;
    dataUrodzenia: string;
    numerTelefonu: string;
    sekretariat: string;
    czyPotrzebujeszWersjiPapierowej: string;
    cel: string;
}

export interface Item {
  id: string;
  ID: number;
  Step : string;
  Rodzaj_sprawy : string;
  Akronim: string;
  Sygnatura: string;
  Student: string;
  Status: string;
  Data: string;
  tm: string
}

export interface itemListResult {
  code: 0;
  message: string;
  list: Item[]
}

export interface FormType {
    id: string;
    name: string
  }

export interface FormtypesResult {
    code: 0;
    message: string;
    result: FormType[]
  }

export interface newFormResult {
    code: 0;
    message: string;
    inst : {id: number, instanceNumber: string, status: string}
    schema: any;
    uischema : any;
    data : any
}

export interface jFormResult {
    code: 0;
    message: string;
    schema: any;
    uischema : any;
    data : any
}

  //export type SelectOption = string[];
export type SelectOption = {
    kod : string;
    Nazwa: string
};
export type Selected = {
     id : string;
     name : string
}

export interface HelpdeskRequest {
    kontakt: string;
    tytul: string;
    kategoria: Selected;
    priorytet: string;
    opis_problemu: string;
}

export interface SelectOptions {
  code: number;
  message: string;
  list: SelectOption[]
}



export const api_jform_update =
 (token : string, id : string, data : any, options: AxiosRequestConfig = {}): Promise<WResult> => {
  return new Promise((resolve, reject) => {
    const configs: AxiosRequestConfig = { ...options, method: 'post' };
    configs.headers = {
      ...options.headers,
      'Content-Type': 'application/json',
      'accept': 'application/json',
      'Authorization': 'Bearer '+token
    };
    configs.url = CONFIG.api_url+'v1/jform/sprawa/update?id='+id.toString();
    configs.data = JSON.stringify(data)
    configs.params=null
    //alert(JSON.stringify(configs))
    axios(configs)
      .then(res => {
        resolve(res.data);
      })
      .catch(err => {
        alert(JSON.stringify(err))
        reject(err);
      });
  });
}


///form_types processid :int = 183,
export const api_form_types = async (token : string, processid = 183,
                                     options : AxiosRequestConfig = {}) :
   Promise<FormtypesResult>  => {
    return new Promise((resolve, reject) => {
        const configs : AxiosRequestConfig = { ...options, method: 'get',
        };
        configs.headers = {
            ...options.headers,
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '+token
        };
//        configs.url = CONFIG.api_url+('v1/jform/form/types?processid='+processid.toString());
        configs.url = CONFIG.api_url+'v1/jform/sprawa/formtypes';
        //s(configs.url)
        configs.data = null;
        axios(configs)
            .then(res => {
            resolve(res.data);
        })
            .catch(err => {
                alert(err)
            reject(err);
        });
    });
}


export const api_items_lista = async (token : string, email : string, options : AxiosRequestConfig = {}) :
   Promise<itemListResult>  => {
    return new Promise((resolve, reject) => {
        const configs : AxiosRequestConfig = { ...options, method: 'get',
        //withCredentials: true // !!! jeśli sesja - musimy wysyłać cookie
        };
        configs.headers = {
            ...options.headers,
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '+token
        };
        configs.url = CONFIG.api_url+
        'v1/jform/report/secured?app=23&rep=162&workflow=214&columns=ID%2CRodzaj%20sprawy%2CData|Date%2CStep|Step%2CSygnatura&email='
        +email;
        //alert(configs.url)
        //CONFIG.api_url+'items/list?user='+email;
        configs.data = null;
        axios(configs)
            .then(res => {
            resolve(res.data);
        })
            .catch(err => {
            reject(err);
        });
    });
}


export const api_post_new_form = async (token : string, request : NewForm, options : AxiosRequestConfig = {}) :
 Promise<newFormResult>  => {
    return new Promise((resolve, reject) => {
        const configs : AxiosRequestConfig = { ...options, method: 'post',
        };
        configs.headers = {
            ...options.headers,
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '+token
        };
        configs.url = CONFIG.api_url+'v1/jform/sprawa/new';
        configs.data = null; //JSON.stringify(request)
        configs.params=request
        axios(configs)
            .then(res => {
            resolve(res.data);
        })
            .catch(err => {
            reject(err);
        });
    });
}

export const api_get_jform = async (token : string, item: number, options : AxiosRequestConfig = {}) :
 Promise<jFormResult>  => {
    return new Promise((resolve, reject) => {
        const configs : AxiosRequestConfig = { ...options, method: 'get',
        };
        configs.headers = {
            ...options.headers,
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '+token
        };
        configs.url = CONFIG.api_url+'v1/jform/sprawa/form';
        configs.data = null; //JSON.stringify(request)
        configs.params={'id':item}
        axios(configs)
            .then(res => {
            resolve(res.data);
        })
            .catch(err => {
            reject(err);
        });
    });
}

/*
export const api_last_attachment = async (token : string, id : string, options : AxiosRequestConfig = {}) :
 Promise<itemListResult>  => {
    return new Promise((resolve, reject) => {
        const configs : AxiosRequestConfig = { ...options, method: 'get',
        //withCredentials: true // !!! jeśli sesja - musimy wysyłać cookie
        };
        configs.headers = {
            ...options.headers,
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '+token
        };
        configs.url = CONFIG.api_url+'lastattachement?itemId='+id;
        configs.data = null;
        axios(configs)
            .then(res => {
            resolve(res.data);
        })
            .catch(err => {
            reject(err);
        });
    });
}
*/

export const api_post_helpdesk_request = async (request : HelpdeskRequest, options : AxiosRequestConfig = {}) :
 Promise<WResult>  => {
    return new Promise((resolve, reject) => {
        const configs : AxiosRequestConfig = { ...options, method: 'post',
        };
        configs.headers = {
            ...options.headers,
            'Content-Type': 'application/json',
            //'Authorization': 'Bearer '+token
        };
        configs.url = CONFIG.api_url+'v1/jform/helpdesk/request';
        configs.data = JSON.stringify(request)
        axios(configs)
            .then(res => {
            resolve(res.data);
        })
            .catch(err => {
            reject(err);
        });
    });
}
/*
export const api_get_kategorie_syst = async (options : AxiosRequestConfig = {}) :
 Promise<SelectOptions>  => {
    return new Promise((resolve, reject) => {
        const configs : AxiosRequestConfig = { ...options, method: 'get',
        };
        configs.headers = {
            ...options.headers,
            'Content-Type': 'application/json'
        };
        configs.url = CONFIG.api_url+'report/public?app=7&rep=97&columns=kod%2CNazwa';
        configs.data = null
//        alert(JSON.stringify(configs))
        axios(configs)
            .then(res => {
                //alert(JSON.stringify(res.data))
                resolve(res.data);
        })
            .catch(err => {
            reject(err);
        });
    });
}
*/


export const api_check_mls = async (token : string,
  request : ReqSTUD,
  options : AxiosRequestConfig = {}) :
Promise<WResult>  => {
 return new Promise((resolve, reject) => {
     const configs : AxiosRequestConfig = { ...options, method: 'get',
     };
     configs.headers = {
         ...options.headers,
         'Content-Type': 'application/json',
         'Authorization': 'Bearer '+token
     };
     configs.url = CONFIG.api_url+'v1/jform/mls/check';
     configs.data = null;
     configs.params=request
     //alert('?')
     axios(configs)
         .then(res => {
         resolve(res.data);
     })
         .catch(err => {
         reject(err);
     });
 });
}


export const api_post_request_mls = async (token : string,
     request : ReqSTUD,
     options : AxiosRequestConfig = {}) :
 Promise<newFormResult>  => {
    return new Promise((resolve, reject) => {
        const configs : AxiosRequestConfig = { ...options, method: 'post',
        };
        configs.headers = {
            ...options.headers,
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '+token
        };
        configs.url = CONFIG.api_url+'v1/jform/mls/request';
        configs.data = request;
        configs.params = null;
        axios(configs)
            .then(res => {
            resolve(res.data);
        })
            .catch(err => {
            reject(err);
        });
    });
}

export const api_get_mls = async (token : string,
  request : ReqSTUD,
  options : AxiosRequestConfig = {}) :
Promise<RelMLS>  => {
 return new Promise((resolve, reject) => {
     const configs : AxiosRequestConfig = { ...options, method: 'get',
     };
     configs.headers = {
         ...options.headers,
         'Content-Type': 'application/json',
         'Authorization': 'Bearer '+token
     };
     configs.url = CONFIG.api_url+'v1/jform/mls/get';
     configs.data = null;
     configs.params=request
     //alert('?')
     axios(configs)
         .then(res => {
         resolve(res.data);
     })
         .catch(err => {
         reject(err);
     });
 });
}

export const uploadFile = async (token : string,
    id : number,
    selectedFile : File,
    description : string,
    options: AxiosRequestConfig = {}
): Promise<WResult> => {
  return new Promise((resolve, reject) => {
    let configs: AxiosRequestConfig = { ...options, method: 'post' };
    configs.headers = {
      ...options.headers,
      'Content-Type': 'multipart/form-data'
    };
    configs.url = CONFIG.api_url+'v1/jform/sprawa/attach';

    let form = new FormData();
    form.append('id', id.toString());
    form.append('att_name', selectedFile.name);
    form.append('att_desc', description);
    form.append('group', '');
    form.append('file', selectedFile);
    configs.data = form;
//    alert(JSON.stringify(configs))
    axios(configs)
      .then(res => {
        resolve(res.data);
      })
      .catch(err => {
        reject(err);
      });
  });
}

//########
export const api_get_ko = async (token : string,
  request : ReqSTUD,
  options : AxiosRequestConfig = {}) :
Promise<RelKO>  => {
 return new Promise((resolve, reject) => {
     const configs : AxiosRequestConfig = { ...options, method: 'get',
     };
     configs.headers = {
         ...options.headers,
         'Content-Type': 'application/json',
         'Authorization': 'Bearer '+token
     };
     configs.url = CONFIG.api_url+'v1/jform/ko/get';
     configs.data = null;
     configs.params=request
     axios(configs)
         .then(res => {
         resolve(res.data);
     })
         .catch(err => {
         reject(err);
     });
 });
}

export const api_post_start_ko = async (token : string, request : ReqSTUD, options : AxiosRequestConfig = {}) :
 Promise<newFormResult>  => {
    return new Promise((resolve, reject) => {
        const configs : AxiosRequestConfig = { ...options, method: 'post',
        };
        configs.headers = {
            ...options.headers,
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '+token
        };
        configs.url = CONFIG.api_url+'v1/jform/ko/start';
        configs.data = request;
        configs.params = null
        axios(configs)
            .then(res => {
            resolve(res.data);
        })
            .catch(err => {
            reject(err);
        });
    });
}
