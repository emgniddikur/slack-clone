use crate::repositories::interfaces::channel::IChannelRepository;
use async_trait::async_trait;
use sqlx::{query_as, FromRow, PgPool};
use uuid::Uuid;

#[derive(FromRow)]
pub struct Channel {
    pub id: Uuid,
}

impl Into<models::channel::Channel> for Channel {
    fn into(self) -> models::channel::Channel {
        models::channel::Channel { id: self.id }
    }
}

pub struct ChannelRepository<'a> {
    pool: &'a PgPool,
}

impl<'a> ChannelRepository<'a> {
    pub fn new(pool: &'a PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl<'a> IChannelRepository for ChannelRepository<'a> {
    async fn list(&self) -> Vec<models::channel::Channel> {
        query_as::<_, Channel>("SELECT * FROM channels")
            .fetch_all(self.pool)
            .await
            .unwrap()
            .into_iter()
            .map(|c| c.into())
            .collect()
    }
}
