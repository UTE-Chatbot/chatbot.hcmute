from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.encoders import jsonable_encoder
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_querybuilder import QueryBuilder
from authlib.integrations.starlette_client import OAuth

from app.db.session import get_db
from app.services.auth_service import register_email, login_email, login_google
from app.schemas.user import UserCreate, Login, UserGoogleCreate
from app.core.security import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from app.core.config import settings
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Auth"])

oauth = OAuth()
oauth.register(
    name='google',
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_id=settings.google_client_id,
    client_secret=settings.google_client_secret,
    client_kwargs={"scope": "openid email profile"}
)


@router.post("/register", response_class=JSONResponse)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    try:
        user = await register_email(db, user_data)
        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content=jsonable_encoder(user)
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"detail": str(e)}
        )


@router.post("/login", response_class=JSONResponse)
async def login(data: Login, db: AsyncSession = Depends(get_db)):
    try:
        user = await login_email(db, data.email, data.password)
        token = create_access_token({"sub": str(user.id), "role": user.role.value})
        

        

        response = JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"access_token": token}
        )

        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            secure=True, 
            samesite="lax",
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60  
        )

        return response
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": str(e)}
        )


@router.get("/google/login", response_class=RedirectResponse)
async def google_login_redirect(request: Request):
    redirect_uri = settings.google_redirect_uri
    return await oauth.google.authorize_redirect(request, redirect_uri)

from fastapi.responses import RedirectResponse

@router.get("/google/callback")
async def google_callback(request: Request, db: AsyncSession = Depends(get_db)):
    try:
        token_data = await oauth.google.authorize_access_token(request)
        user_info = token_data.get("userinfo")
        if not user_info:
            user_info = await oauth.google.userinfo(token=token_data)

        google_user = await login_google(db, UserGoogleCreate(
            email=user_info["email"],
            full_name=user_info.get("name"),
            avatar=user_info.get("picture"),
            google_id=user_info["sub"]
        ))

        jwt_token = create_access_token({
            "sub": str(google_user.id),
            "role": google_user.role.value
        })


        response = RedirectResponse(
            url=f"{settings.frontend_url}/auth/google/success" 
        )

        response.set_cookie(
            key="access_token",
            value=jwt_token,
            httponly=True,
            secure=False,  
            samesite="lax",
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )


        return response

    except Exception as e:
        return RedirectResponse(
            url=f"{settings.frontend_url}/auth/google/error?message={str(e)}"
        )



@router.get("/me", response_class=JSONResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content=jsonable_encoder(current_user)
    )


@router.post("/logout", response_class=JSONResponse)
async def logout(current_user: User = Depends(get_current_user)):
    response = JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"message": "Đăng xuất thành công"}
    )
    
    response.delete_cookie(
        key="access_token",
        httponly=True,
        secure=True,
        samesite="lax"
    )
    return response


@router.post("/get", response_class=JSONResponse)
def get_profiles(query=QueryBuilder(User)):
    try:
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"profiles": "OK"}
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": str(e)}
        )