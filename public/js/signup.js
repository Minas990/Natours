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


const signup =async (data) =>{
    try
    {
        const res = await axios({
            method:'POST',
            url:'/api/v1/users/signup',
            data
        });
        if(res.data.status ==='success')
        {
            showAlert('success','singed up');
            window.setTimeout(() => {
                location.assign('/')
            },1000)
        }
    }
    catch(err)
    {
        console.log(err);
        showAlert('error',err.response.data.message);
    }
}


const form  = document.querySelector('.form');
if(form)
{
    form.addEventListener('submit',function(e) {
        e.preventDefault();
        const data = {};
        data.email =document.getElementById('email').value;
        data.name=document.getElementById('name').value;
        data.password=document.getElementById('password').value;
        data.passwordConfirm = document.getElementById('passwordConfirm').value;
        signup(data);
    });
}    


