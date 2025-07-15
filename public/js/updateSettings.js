/* eslint-disable*/


const form = document.querySelector('.form-user-data');

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

const JustUpdate = async function(data,type,ok)
{
    try
    {
        const res = await axios({
            url:`/api/v1/users/${type==='password' ? 'updateMyPassword':'updateMe'}`,
            method: 'PATCH',
            data
        });
        if(res.data.status === 'success');
        {
            showAlert('success',`${type} updated`.toUpperCase());
        }
    }
    catch(err)
    {
        showAlert('error',err.response.data.message);
        ok.true = false;
    }
}

form.addEventListener('submit',function(e){
    e.preventDefault();
    const formData = new FormData();
    formData.append('name',document.querySelector('#name').value)
    formData.append('email',document.querySelector('#email').value)
    formData.append('photo',document.getElementById('photo').files[0]);
    JustUpdate(formData,'data');
});


const passwordForm = document.querySelector('.form-user-settings');
passwordForm.addEventListener('submit',async function(e){
    e.preventDefault();
    document.querySelector('.btn--save--password').textContent= `Updating`;
    const passwordCurrent = document.querySelector('#password-current').value;
    const password = document.querySelector('#password').value;
    const passwordConfirm = document.querySelector('#password-confirm').value;
    let ok = {true:true};
    await JustUpdate({passwordCurrent,password,passwordConfirm},'password',ok);
    document.querySelector('.btn--save--password').textContent= `save password`;
    if(ok.true)
    {
        document.querySelector('#password-current').value = ''
        document.querySelector('#password').value ='';
        document.querySelector('#password-confirm').value='';
    }
});


