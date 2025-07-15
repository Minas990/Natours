/* eslint-disable*/

const showAlert = (type,msg) => 
{
    hideAlert();
    const markup = `<div class="alert alert--${type}">${msg}</div> `;
    document.querySelector('body').insertAdjacentHTML('afterbegin',markup);
    window.setTimeout(hideAlert,5000);
}

const hideAlert = () => 
{
    const el = document.querySelector('.alert');
    if(el) el.parentElement.removeChild(el);
}


const login =async (email,password) =>{
    try
    {
        const res = await axios({
            method:'post',
            url:'/api/v1/users/login',
            data: {
                email,
                password
            }
        });
        if(res.data.status ==='success')
        {
            showAlert('success','logged in');
            window.setTimeout(() => {
                location.assign('/')
            },1500)
        }
    }
    catch(err)
    {
        showAlert('error',err.response.data.message);
    }
}


const form  = document.querySelector('.form');
if(form)
{
    form.addEventListener('submit',function(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        login(email,password);
    });
}    


